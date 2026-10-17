//! # `fetch` pipeline
//!
//! ```text
//! fetch(options)
//!   │
//!   ├─ 1. Uid::parse ─────────── format check only; resolve Gamebiz
//!   │      └─ Err → GachaFetchError::InvalidUid
//!   │
//!   ├─ 2. ParsedGachaUrl::parse ── parse only; ownership NOT re-verified
//!   │      └─ Err → GachaFetchError::Parse
//!   │
//!   ├─ 3. FullUpdate? discard last_end_id
//!   │
//!   ├─ 4. scrape(...)
//!   │      │
//!   │      ├─ scraper callback:
//!   │      │    Data(logs) → first.uid != expected?
//!   │      │      ├─ yes → actual_uid.store + ControlFlow::Break
//!   │      │      └─ no  → event_channel.send + ControlFlow::Continue
//!   │      │
//!   │      └─ returns ControlFlow
//!   │            ├─ Break        → GachaFetchError::InconsistentUid
//!   │            └─ Continue(logs) → proceed
//!   │
//!   ├─ 5. to_records
//!   │      ├─ locale normalization (first log.lang, fallback url.lang)
//!   │      └─ to_record × N
//!   │            ├─ item_id missing → metadata lookup by name
//!   │            ├─ rank / type / name missing → metadata fill by id
//!   │            ├─ timezone → Uid::parse(log.uid) or region_time_zone
//!   │            └─ properties → Miliastra Wonderland only
//!   │
//!   └─ 6. save
//!         ├─ No          → 0
//!         ├─ Yes         → save_transaction
//!         └─ FullUpdate  → group by gacha_type;
//!                          delete records newer than the oldest in the batch,
//!                          then re-insert the batch
//!                └─ returns created - deleted
//! ```

use std::collections::HashMap;
use std::fmt;
use std::ops::ControlFlow;
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, Ordering};

use hg_gamebiz::{GachaLogEndpoint, Uid};
use hg_metadata::Metadata;
use hg_url_parser::{GachaUrlParseError, ParsedGachaUrl};
use hg_url_scraper::request::{GachaUrlRequestError, RetryOptions};
use hg_url_scraper::{
  GachaLog, GachaType, GachaTypes, GachaUrlScraper, GachaUrlScraperEvent, ScrapeRange,
  ScrapedGachaLogs,
};
use serde::{Deserialize, Deserializer, Serialize};
use serde_json::json;
use snafu::{OptionExt, ResultExt, Snafu};
use tauri::ipc::Channel;
use time::UtcOffset;
use tracing::{debug, error, info, trace};

use crate::business::stats::BannerCategory;
use crate::constants;
use crate::database::schemas::{
  AccountBusiness, GachaRecord, GachaRecordQuestioner, GachaRecordSaveOnConflict, Properties,
  save_transaction,
};
use crate::database::{Database, DatabaseError};
use crate::error::{DetailedError, KIND};

#[derive(Debug, Snafu)]
pub enum GachaFetchError {
  #[snafu(
    display("Invalid {business:?} account uid: {value}"),
    context(suffix(false))
  )]
  InvalidUid {
    business: AccountBusiness,
    value: u32,
  },

  #[snafu(display("{source}"), context(suffix(false)))]
  Parse { source: GachaUrlParseError },

  #[snafu(display("{source}"), context(suffix(false)))]
  Request { source: GachaUrlRequestError },

  /// A scraped log reported a different `uid` than the one we're fetching
  /// for. Emitted from the scrape callback before any records are
  /// persisted, so no data is written under the wrong account.
  #[snafu(
    display("Scraped data uid does not match: expected {expected}, got {actual}"),
    context(suffix(false))
  )]
  InconsistentUid { expected: u32, actual: u32 },

  #[snafu(display("Missing metadata item: {business:?}, lang: {lang}, item_name: {item_name}"))]
  Metadata {
    business: AccountBusiness,
    lang: String,
    item_name: String,
  },

  #[snafu(display("{source}"))]
  Database { source: DatabaseError },
}

impl DetailedError for GachaFetchError {
  fn name(&self) -> &'static str {
    match self {
      // Source-bearing variants: delegate to the inner error, if it has
      // details of its own.
      Self::Parse { source } => source.name(),
      Self::Request { source } => source.name(),
      Self::Database { source } => source.name(),

      _ => stringify!(GachaFetchError),
    }
  }

  fn details(&self) -> Option<serde_json::Value> {
    match self {
      Self::InvalidUid { business, value } => Some(json!({
        KIND: stringify!(InvalidUid),
        "business": business,
        "value": value,
      })),

      // Source-bearing variants: delegate to the inner error, if it has
      // details of its own.
      Self::Parse { source } => source.details(),
      Self::Request { source } => source.details(),
      Self::Database { source } => source.details(),

      Self::InconsistentUid { expected, actual } => Some(json!({
        KIND: stringify!(InconsistentUid),
        "expected": expected,
        "actual": actual,
      })),
      Self::Metadata {
        business,
        lang,
        item_name,
      } => Some(json!({
        KIND: stringify!(Metadata),
        "business": business,
        "lang": lang,
        "itemName": item_name,
      })),
    }
  }
}

#[derive(Copy, Clone, Debug, Default, Deserialize)]
pub enum GachaRecordSaveToDatabase {
  #[default]
  No,
  Yes,
  FullUpdate,
}

#[derive(Debug, Serialize)]
pub enum FetchEventPayload {
  Sleeping,
  Ready(Option<BannerCategory>),
  Pagination(usize),
  Data(usize),
  Completed(Option<BannerCategory>),
  Finished,
}

impl FetchEventPayload {
  pub(crate) fn from_scraper(business: AccountBusiness, event: GachaUrlScraperEvent) -> Self {
    match event {
      GachaUrlScraperEvent::Sleeping => Self::Sleeping,
      GachaUrlScraperEvent::Ready(n) => Self::Ready(BannerCategory::from_gacha_type(business, n)),
      GachaUrlScraperEvent::Pagination(n) => Self::Pagination(n),
      GachaUrlScraperEvent::Data(logs) => Self::Data(logs.len()),
      GachaUrlScraperEvent::Completed(n) => {
        Self::Completed(BannerCategory::from_gacha_type(business, n))
      }
      GachaUrlScraperEvent::Finished => Self::Finished,
    }
  }
}

/// A gacha URL whose `Debug` output redacts the query string.
///
/// The query carries the `authkey`, which must never end up in logs. The
/// raw value is still available via [`Self::as_str`] / [`Deref`] for
/// business logic. `Display` prints the raw value — **do not** use it in
/// logs; use `{:?}` (which `tracing::instrument` uses by default).
#[derive(Clone, Deserialize)]
#[serde(transparent)]
pub struct RedactedGachaUrl(pub String);

impl fmt::Debug for RedactedGachaUrl {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self.0.split_once('?') {
      Some((endpoint, _)) => write!(f, "\"{endpoint}?<redacted>\""),
      None => write!(f, "{:?}", self.0),
    }
  }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchOptions<'a> {
  /// Which game the account belongs to.
  pub business: AccountBusiness,
  /// The account uid to scrape for.
  pub uid: u32,
  /// A user-supplied gacha URL (raw; may be dirty).
  pub gacha_url: RedactedGachaUrl,
  /// Gacha types to scrape, each with an optional `last_end_id`.
  ///
  /// `last_end_id` marks the newest already-known record: the scraper
  /// stops when it reaches it, avoiding duplicate downloads.
  #[serde(borrow, deserialize_with = "deserialize_gacha_ranges")]
  pub gacha_ranges: Vec<ScrapeRange<'a>>,
  /// Whether (and how) to persist the scraped records.
  #[serde(default)]
  pub save_to_database: GachaRecordSaveToDatabase,
  /// Conflict resolution when `save_to_database` is not [`No`].
  #[serde(default)]
  pub save_on_conflict: GachaRecordSaveOnConflict,
}

// Frontend: [GachaType<T>, GachaRecord<T>['id'] | null | undefined][]
fn deserialize_gacha_ranges<'de, D>(de: D) -> Result<Vec<ScrapeRange<'de>>, D::Error>
where
  D: Deserializer<'de>,
{
  let raws = Vec::<(GachaType, Option<&'de str>)>::deserialize(de)?;
  let ranges: Vec<ScrapeRange<'de>> = raws.into_iter().map(ScrapeRange::from).collect();
  Ok(ranges)
}

/// Fetch gacha records for `uid` using a pre-verified gacha URL.
///
/// # Contract
///
/// - `uid` is validated for **format** only ([`Uid::parse`]). The
///   resolved [`Gamebiz`](hg_gamebiz::Gamebiz) is required later to stamp
///   each record's timezone and to drive the endpoint selection, so this
///   step is mandatory regardless of caller trust.
/// - `gacha_url` is **not** re-verified for ownership. The caller is
///   expected to have run `GachaUrl::from_webcaches` /
///   `GachaUrl::from_dirty`, which check `game_biz` / `region` and
///   confirm the server-reported `uid` matches. Repeating that here would
///   cost an extra HTTP round-trip.
///
/// A caller that bypasses the frontend (`invoke` directly with a
/// mismatched `uid` + `gacha_url`) is caught during scraping: the first
/// scraped batch whose `uid` differs short-circuits the scrape and
/// returns [`GachaFetchError::InconsistentUid`] **before** any records
/// are written.
///
/// # Pipeline
///
/// 1. Validate `uid` format; resolve `Gamebiz` (timezone + endpoint).
/// 2. Parse the gacha URL.
/// 3. In `FullUpdate` mode, discard `last_end_id` so the scraper walks
///    the entire history.
/// 4. Scrape — see [`scrape`] for the uid-mismatch fast-fail.
/// 5. Convert raw logs into [`GachaRecord`]s (metadata fallback + locale
///    normalization).
/// 6. Persist according to `save_to_database`.
#[tracing::instrument(
  skip_all,
  fields(
    business = ?options.business,
    uid = options.uid,
    gacha_url = ?options.gacha_url, // redacted
    gacha_ranges = options.gacha_ranges.len(),
    save_to_database = ?options.save_to_database,
    save_on_conflict = ?options.save_on_conflict,
  ),
)]
pub async fn fetch(
  database: &Database,
  metadata: &dyn Metadata,
  event_channel: Channel<FetchEventPayload>,
  options: FetchOptions<'_>,
) -> Result<i64, GachaFetchError> {
  let FetchOptions {
    business,
    uid,
    gacha_url,
    mut gacha_ranges,
    save_to_database,
    save_on_conflict,
  } = options;

  // 1. Validate uid.
  //
  // Format check only — not an ownership check. The parsed `Gamebiz` is
  // needed downstream for endpoint selection and timezone resolution.
  let uid = Uid::parse(business.as_game(), uid).context(InvalidUid {
    business,
    value: uid,
  })?;

  // 2. Parse the gacha URL.
  //
  // Ownership is not re-verified here; see the function-level Contract
  // note. If the URL belongs to a different account, the scrape callback
  // catches it on the first `Data` event (step 4).
  let url = ParsedGachaUrl::parse(&gacha_url.0).context(Parse)?;

  info!("Fetching gacha records...");

  // 3. FullUpdate discards `last_end_id` so the scraper re-walks the
  //    entire history from the newest server-side page.
  if matches!(save_to_database, GachaRecordSaveToDatabase::FullUpdate) {
    debug!("FullUpdate mode: discarding last_end_id for all ranges");
    for range in gacha_ranges.iter_mut() {
      range.last_end_id.take();
    }
  }

  // 4. Scrape.
  let actual_uid = Arc::new(AtomicU32::new(0));
  let logs = match scrape(
    business,
    &url,
    gacha_ranges,
    event_channel,
    uid.value(),
    Arc::clone(&actual_uid),
  )
  .await
  .context(Request)?
  {
    ControlFlow::Continue(logs) => logs,
    ControlFlow::Break(()) => {
      // Break means the callback saw a mismatched `uid`. Nothing was
      // persisted — surface it as `InconsistentUid`.
      return InconsistentUid {
        expected: uid.value(),
        actual: actual_uid.load(Ordering::Acquire),
      }
      .fail();
    }
  };
  info!(
    message = "Scraped gacha logs",
    records = logs.data.len(),
    region = ?logs.region,
    region_timezone = ?logs.region_time_zone,
  );

  // 5. Convert.
  let records = to_records(metadata, business, &url.lang, logs)?;
  debug!(message = "Converted scraped logs", records = records.len());

  // 6. Save.
  let changes = save(
    database,
    business,
    uid.value(),
    records,
    save_to_database,
    save_on_conflict,
  )
  .await
  .context(DatabaseSnafu)?;

  // Okay
  info!(message = "Gacha records saved", changes);
  Ok(changes)
}

/// Scrape gacha logs for `business`, splitting the ranges across the
/// endpoints each game actually exposes.
///
/// # Endpoint selection
///
/// - **Genshin Impact / Zenless Zone Zero** → [`GachaLogEndpoint::Standard`]
/// - **Miliastra Wonderland** → [`GachaLogEndpoint::Hk4eBeyond`]
/// - **Honkai: Star Rail** → two endpoints (see [`split_hkrpg_collabs`])
///
/// # uid mismatch fast-fail
///
/// The callback inspects every `Data` batch. If the first log's `uid`
/// differs from `expected_uid`, it stores the actual uid in `actual_uid`
/// and returns [`ControlFlow::Break`]. The scraper then aborts, discards
/// partial data, and this function returns `Ok(ControlFlow::Break(()))`
/// — no HTTP requests are wasted on subsequent pages, and nothing is
/// persisted.
///
/// The check runs inside the callback rather than after the scrape
/// because a mismatch usually means the whole URL is for a different
/// account — continuing would just download more of the same wrong data.
#[tracing::instrument(
  skip_all,
  fields(
    business,
    ranges = ranges.len(),
    expected_uid,
  ),
)]
async fn scrape(
  business: AccountBusiness,
  url: &ParsedGachaUrl<'_>,
  ranges: Vec<ScrapeRange<'_>>,
  event_channel: Channel<FetchEventPayload>,
  expected_uid: u32,
  actual_uid: Arc<AtomicU32>,
) -> Result<ControlFlow<(), ScrapedGachaLogs>, GachaUrlRequestError> {
  let scraper = GachaUrlScraper::new(
    url,
    RetryOptions::default(),
    tokio::time::sleep,
    Some(Box::new(move |event| {
      // Full event stream is useful when debugging scraper issues
      // (rate-limits, pagination loops, …) but far too noisy for `debug`.
      match event {
        GachaUrlScraperEvent::Data(logs) => trace!(message = "Scraper data", batch = logs.len()),
        _ => trace!(message = "Scraper event", ?event),
      }

      if let GachaUrlScraperEvent::Data(logs) = event
        && let Some(first) = logs.first()
        && first.uid != expected_uid
      {
        error!(
          message = "Scraped uid mismatch, stopping",
          expected = expected_uid,
          actual = first.uid,
        );

        actual_uid.store(first.uid, Ordering::Release);
        return ControlFlow::Break(());
      }

      let _ = event_channel.send(FetchEventPayload::from_scraper(business, event));
      ControlFlow::Continue(())
    })),
  );

  match business {
    AccountBusiness::GenshinImpact | AccountBusiness::ZenlessZoneZero => {
      debug!(message = "Scraping standard endpoint", endpoint = ?GachaLogEndpoint::Standard);
      scraper
        .scrape(GachaLogEndpoint::Standard, &ranges, None)
        .await
    }
    AccountBusiness::MiliastraWonderland => {
      debug!(message = "Scraping beyond endpoint", endpoint = ?GachaLogEndpoint::Hk4eBeyond);
      scraper
        .scrape(GachaLogEndpoint::Hk4eBeyond, &ranges, None)
        .await
    }
    AccountBusiness::HonkaiStarRail => {
      let (standard, collabs) = split_hkrpg_collabs(ranges);
      debug!(
        message = "Scraping hkrpg standard + collabs endpoints",
        ?standard,
        ?collabs
      );
      scraper
        .scrape_multiple(
          &[
            (GachaLogEndpoint::Standard, &standard),
            (GachaLogEndpoint::HkrpgCollab, &collabs),
          ],
          None,
        )
        .await
    }
  }
}

/// Split 'Honkai: Star Rail' ranges into standard and collaboration groups.
///
/// Honkai: Star Rail exposes collaboration banners on a different
/// endpoint than the rest. They must be requested separately — mixing
/// them in one `scrape` call would just return empty data for the wrong
/// endpoint.
fn split_hkrpg_collabs<'a>(
  ranges: Vec<ScrapeRange<'a>>,
) -> (Vec<ScrapeRange<'a>>, Vec<ScrapeRange<'a>>) {
  use GachaTypes::Hkrpg::{COLLAB_CHARACTER, COLLAB_LIGHTCONE};

  let mut standard = Vec::with_capacity(ranges.len());
  let mut collabs = Vec::with_capacity(2);

  for range in ranges {
    if range.gacha_type == COLLAB_CHARACTER || range.gacha_type == COLLAB_LIGHTCONE {
      collabs.push(range);
    } else {
      standard.push(range);
    }
  }

  (standard, collabs)
}

/// Convert scraped logs into `GachaRecord`s, applying locale normalization
/// and metadata fallback.
///
/// # Locale
///
/// The preferred language comes from the first log's `lang`, falling back
/// to the URL's own `lang`. Aliases like `"en"` → `"en-us"` are resolved
/// through [`hg_metadata::LOCALE_ALIASES`]; a hit is free (the alias is a
/// `&'static str`), a miss allocates the fallback `String`.
#[tracing::instrument(
  skip_all,
  fields(
    business,
    url_lang,
    logs = logs.data.len(),
  ),
)]
fn to_records(
  metadata: &dyn Metadata,
  business: AccountBusiness,
  url_lang: &str,
  logs: ScrapedGachaLogs,
) -> Result<Vec<GachaRecord>, GachaFetchError> {
  // Resolve the preferred language in a scoped borrow of `logs`, then
  // materialize it as owned so `logs.data` can be moved below.
  //
  // `LOCALE_ALIASES` returns `&'static str` on a hit, so a hit costs zero
  // allocation; only a miss allocates the fallback `String`.
  let preferred_lang: String = {
    let raw = logs
      .data
      .first()
      .and_then(|log| log.lang.as_deref())
      .unwrap_or(url_lang);

    let normalized = hg_metadata::LOCALE_ALIASES.get(raw).copied().unwrap_or(raw);
    if normalized != raw {
      debug!(
        message = "Correcting locale alias",
        from = raw,
        to = normalized
      );
    }

    normalized.to_owned()
  };

  // Convert
  let region_timezone = logs.region_time_zone;
  let mut records = Vec::with_capacity(logs.data.len());

  for log in logs.data {
    records.push(to_record(
      metadata,
      business,
      &preferred_lang,
      region_timezone,
      log,
    )?);
  }

  Ok(records)
}

/// Convert one scraped log into a `GachaRecord`.
///
/// # Field availability (per game)
///
/// - **Genshin Impact** — no `item_id`; must look up by `item_name`.
/// - **Miliastra Wonderland / Honkai: Star Rail / Zenless Zone Zero** —
///   may have empty `rank_type` / `item_type` / `item_name`; fill from metadata by `item_id`.
///
///   See:
///   - <https://github.com/lgou2w/HoYo.Gacha/issues/59>
///   - <https://github.com/lgou2w/HoYo.Gacha/issues/163>
///   - <https://github.com/lgou2w/HoYo.Gacha/issues/166>
///
/// # Timezone
///
/// Resolved from `log.uid` via [`Uid::parse`] — this recovers the exact
/// `Gamebiz` (region + timezone) for each record. If the uid format is
/// unexpected (should never happen for real data), falls back to the
/// region-level timezone reported by the server in
/// [`ScrapedGachaLogs::region_time_zone`], then to local.
fn to_record(
  metadata: &dyn Metadata,
  business: AccountBusiness,
  preferred_lang: &str,
  region_timezone: Option<i8>,
  log: GachaLog,
) -> Result<GachaRecord, GachaFetchError> {
  let gacha_type = log.preferred_gacha_type();
  let mut rank_type = log.rank_type;
  let mut item_type = log.item_type;
  let mut item_name = log.item_name;

  // Resolve `item_id`: trust the log when present, otherwise look up by name.
  let item_id = match log.item_id {
    Some(id) => id,
    None => {
      // HACK: Genshin Impact only
      //   Mandatory mapping of item ids.
      //   If metadata is outdated, this error will be thrown.

      // It definitely will. If `item_name` is empty, then there's really nothing we can do.
      // Please report this to the official support.
      // Security checks to avoid unwrap panic
      let Some(item_name) = item_name.as_deref().filter(|s| !s.is_empty()) else {
        return MetadataSnafu {
          business,
          lang: preferred_lang,
          item_name: "",
        }
        .fail();
      };

      metadata
        .locale(business.into(), preferred_lang)
        .and_then(|locale| locale.item_by_name(item_name))
        .with_context(|| {
          error!(
            message = "Failed to map item name to item id, outdated metadata?",
            ?business,
            ?preferred_lang,
            ?log.id,
            ?item_name,
            ?log.gacha_type,
            ?log.rank_type,
          );
          MetadataSnafu {
            business,
            lang: preferred_lang,
            item_name,
          }
        })?
        .item_id
    }
  };

  // See the file-header HACK for the field-availability matrix.
  // When any of `rank_type` / `item_type` / `item_name` is missing or
  // blank, fill it from metadata by `item_id`.
  if rank_type.is_none()
    || item_type.as_ref().is_none_or(|s| s.is_empty())
    || item_name.as_ref().is_none_or(|s| s.is_empty())
  {
    let item = metadata
      .locale(business.into(), preferred_lang)
      .and_then(|locale| locale.item(item_id))
      .with_context(|| {
        error!(message = "Failed to map item id, outdated metadata?");
        MetadataSnafu {
          business,
          lang: preferred_lang,
          item_name: match &item_name {
            None => format!("{item_id}"),
            Some(s) => format!("{item_id} ({s})"),
          },
        }
      })?;

    // Fills
    rank_type.get_or_insert(item.rank_type.into());

    if item_type.as_ref().is_none_or(String::is_empty) {
      item_type = Some(item.category_name.to_owned());
    }

    if item_name.as_ref().is_none_or(String::is_empty) {
      item_name = Some(item.item_name.to_owned());
    }
  }

  // SAFETY: Above guarantees the branch above ran for
  // every missing field, and metadata never returns blank values.
  let rank_type = rank_type.expect("rank_type resolved");
  let item_type = item_type.expect("item_type resolved");
  let item_name = item_name.expect("item_name resolved");

  // HACK: 'Genshin Impact: Miliastra Wonderland' needs to retain some special field values,
  //   which may be used in the future.
  let properties = if business == AccountBusiness::MiliastraWonderland {
    let mut value = Properties::with_capacity(2);

    if let Some(schedule_id) = log.schedule_id {
      value.insert(GachaRecord::KEY_SCHEDULE_ID.into(), schedule_id.into());
    }

    // HACK: Only keep it if it is not "0".
    //   https://github.com/UIGF-org/UIGF-org.github.io/issues/108#issuecomment-3450043575
    if let Some(is_up) = log.is_up
      && is_up.as_str() != GachaRecord::IS_UP_ZERO
    {
      value.insert(GachaRecord::KEY_IS_UP.into(), is_up.into());
    }

    Some(value)
  } else {
    None
  };

  // Prefer the per-record uid's timezone (exact `Gamebiz`). Fall back to
  // the region-level timezone from the server, then UTC.
  let timezone_offset = Uid::parse(business.as_game(), log.uid)
    .map(|uid| uid.gamebiz().timezone())
    .unwrap_or_else(|| {
      region_timezone
        .and_then(|hours| UtcOffset::from_hms(hours, 0, 0).ok())
        .unwrap_or(*constants::LOCAL_OFFSET) // It usually doesn't happen.
    });

  // Okay
  Ok(GachaRecord {
    business,
    uid: log.uid,
    id: log.id,
    gacha_type,
    gacha_id: log.gacha_id,
    rank_type,
    count: log.count,
    time: log.time.assume_offset(timezone_offset),
    lang: preferred_lang.to_owned(),
    item_name,
    item_type,
    item_id,
    properties,
  })
}

#[tracing::instrument(
  skip_all,
  fields(
    business,
    uid,
    records = records.len(),
    mode = ?save_to_database,
  ),
)]
async fn save(
  database: &Database,
  business: AccountBusiness,
  uid: u32,
  records: Vec<GachaRecord>,
  save_to_database: GachaRecordSaveToDatabase,
  save_on_conflict: GachaRecordSaveOnConflict,
) -> Result<i64, DatabaseError> {
  match save_to_database {
    GachaRecordSaveToDatabase::No => Ok(0),
    GachaRecordSaveToDatabase::Yes => Ok(
      save_transaction(database, records, save_on_conflict, Option::<fn(u64)>::None).await? as i64,
    ),
    GachaRecordSaveToDatabase::FullUpdate => {
      save_full_update(database, business, uid, records, save_on_conflict).await
    }
  }
}

/// Full-update mode: replace the server-known logs.
///
/// For each `gacha_type`, delete every record newer than the oldest
/// scraped `id`, then re-insert the scraped batch. This handles the
/// case where the server's copy has changed (item names, ranks, etc.) —
/// re-inserting refreshes the local mirror.
///
/// Returns the net change:
/// - **positive** — new records were added;
/// - **negative** — the scraped batch was smaller than what was deleted;
/// - **zero** — no change.
#[tracing::instrument(
  skip_all,
  fields(
    business,
    uid,
    records = records.len(),
    conflict = ?save_on_conflict,
  ),
)]
async fn save_full_update(
  database: &Database,
  business: AccountBusiness,
  uid: u32,
  records: Vec<GachaRecord>,
  save_on_conflict: GachaRecordSaveOnConflict,
) -> Result<i64, DatabaseError> {
  // Group by gacha_type so each type is replaced independently.
  let mut groups: HashMap<u32, Vec<GachaRecord>> = HashMap::new();
  for record in records {
    groups.entry(record.gacha_type).or_default().push(record);
  }

  let mut deleted: i64 = 0;
  let mut created: i64 = 0;

  for (gacha_type, group) in groups {
    // `group` is ordered **newest → oldest**: the scraper walks history
    // backwards, so each batch is appended in the order it was fetched
    // (latest first). The last entry is therefore the oldest record in
    // this batch — deleting "newer than it" wipes the portion we're about
    // to re-insert and preserves anything older that the server has
    // already dropped.
    let Some(oldest_end_id) = group.last().map(|e| e.id.clone()) else {
      continue;
    };

    let deleted_n = database
      .interact(move |conn| {
        conn.delete_gacha_records_with_newer_than_end_id(business, uid, gacha_type, oldest_end_id)
      })
      .await? as i64;

    let created_n =
      save_transaction(database, group, save_on_conflict, Option::<fn(u64)>::None).await? as i64;

    created += created_n;
    deleted += deleted_n;

    debug!(
      message = "Replaced gacha_type batch",
      gacha_type,
      deleted = deleted_n,
      created = created_n,
    );
  }

  // Negative result means old data had duplicates or errors; positive means new data.
  Ok(created - deleted)
}
