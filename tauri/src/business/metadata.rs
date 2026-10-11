use std::ops::Deref;
use std::sync::Arc;

use hg_metadata::providers::JsonProvider;
use hg_metadata::{Metadata, MismatchedItemsAndNames};
use snafu::{ResultExt, Snafu};
use tokio::sync::{RwLock, RwLockReadGuard};
use tracing::{debug, info};

#[derive(Debug, Snafu)]
#[snafu(context(suffix(false)))]
pub enum MetadataError {
  #[snafu(display("Failed to deserialize metadata: {source}"))]
  Json { source: serde_json::Error },

  #[snafu(display("Failed to load metadata: {source}"))]
  Mismatched { source: MismatchedItemsAndNames },
}

pub struct MetadataService {
  inner: RwLock<MetadataServiceInner>,
}

pub type TauriMetadataState<'r> = tauri::State<'r, Arc<MetadataService>>;

impl MetadataService {
  #[tracing::instrument]
  pub async fn load() -> Result<Self, MetadataError> {
    info!("Initializing gacha metadata...");

    let inner = MetadataServiceInner::new()?;
    info!(message = "Gacha metadata initialized", hash = ?inner.hash);

    let s = Self {
      inner: RwLock::new(inner),
    };

    #[cfg(any(debug_assertions, test))]
    s.dump().await;

    Ok(s)
  }

  /// Get the current metadata hash.
  pub async fn hash(&self) -> Arc<str> {
    Arc::clone(&self.inner.read().await.hash)
  }

  #[cfg(any(debug_assertions, test))]
  #[tracing::instrument(skip_all)]
  pub(crate) async fn dump(&self) {
    use crate::constants::APP_NAME;
    use std::path::PathBuf;
    use tokio::fs::File;
    use tokio::io::{AsyncWriteExt, BufWriter};

    let output =
      PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(format!("{APP_NAME}.Metadata.Dump.txt"));

    tracing::debug!(message = "Dumping metadata...", ?output);
    if let Ok(file) = File::create(output).await {
      let inner = { &*self.inner.read().await };
      {
        let mut writer = BufWriter::new(file);
        let data1 = format!("Hash: {:?}\n", inner.hash);
        let data2 = format!("{:#?}", inner.native);
        let _ = writer.write_all(data1.as_bytes()).await;
        let _ = writer.write_all(data2.as_bytes()).await;
      }
    }
  }
}

// Test only embedded metadata
cfg_if::cfg_if!(if #[cfg(test)] {
  static EMBEDDED: std::sync::LazyLock<MetadataServiceInner> =
    std::sync::LazyLock::new(|| MetadataServiceInner::new().expect("Failed to load embedded metadata"));

  impl MetadataService {
    pub fn embedded() -> &'static dyn Metadata {
      &*EMBEDDED.native
    }
  }
});

// region: Read Guard

pub struct MetadataReadGuard<'a> {
  guard: RwLockReadGuard<'a, MetadataServiceInner>,
}

impl<'a> Deref for MetadataReadGuard<'a> {
  type Target = dyn Metadata;

  fn deref(&self) -> &Self::Target {
    &*self.guard.native
  }
}

impl MetadataService {
  pub async fn read(&self) -> MetadataReadGuard<'_> {
    MetadataReadGuard {
      guard: self.inner.read().await,
    }
  }
}

// endregion

// region: Inner

fn sha1sum(input: &[u8]) -> String {
  use sha1::{Digest, Sha1};
  const HEX: &[u8; 16] = b"0123456789abcdef";

  let digest = Sha1::digest(input);
  let mut output = String::with_capacity(40);
  let mut buf = [0; 2];

  for byte in digest {
    buf[0] = HEX[(byte >> 4) as usize];
    buf[1] = HEX[(byte & 0xF) as usize];
    output.push_str(std::str::from_utf8(&buf).unwrap());
  }

  output
}

struct MetadataServiceInner {
  native: Box<dyn Metadata>,
  hash: Arc<str>,
}

impl MetadataServiceInner {
  const EMBEDDED_METADATA: &[u8] = include_bytes!("../assets/GachaMetadata.json");

  /// Initialize from embedded metadata.
  fn new() -> Result<Self, MetadataError> {
    Self::new_with(Self::EMBEDDED_METADATA, None)
  }

  /// Initialize from raw bytes.
  ///
  /// `hash` should be the SHA-1 hash of the bytes, if known.
  /// Avoid multiple calculations.
  #[tracing::instrument(fields(bytes = bytes.len()))]
  fn new_with(bytes: &[u8], hash: Option<String>) -> Result<Self, MetadataError> {
    debug!("Loading and baking metadata...");
    let provider = JsonProvider::from_slice(bytes);
    let native = hg_metadata::load(provider)
      .context(Json)?
      .context(Mismatched)?;

    Ok(Self {
      native,
      hash: Arc::from(hash.unwrap_or_else(|| sha1sum(bytes))),
    })
  }
}

// endregion

// Test
#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn embedded() {
    let _ = MetadataService::embedded();
  }
}
