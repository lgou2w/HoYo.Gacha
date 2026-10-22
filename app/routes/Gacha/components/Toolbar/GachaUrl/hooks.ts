import { MouseEventHandler, use, useCallback, useRef, useState } from 'react'
import { Account, AccountBusiness } from '@/api/Account'
import { extractErrorMessage } from '@/api/error'
import { KnownI18nNs, UseI18n, useI18n } from '@/i18n'
import { BusinessCommands, FetchRecordsOptions, GachaUrl, SaveToDatabase } from '@/routes/Gacha/api/business'
import { isGachaUrlAuthkeyTimeout } from '@/routes/Gacha/api/error'
import { useAccount, useUpdateAccountPropertiesMutation } from '@/routes/Gacha/contexts/Account/hooks'
import { useGachaStats } from '@/routes/Gacha/contexts/Stats/hooks'
import { invalidateGachaStatsQuery } from '@/routes/Gacha/contexts/Stats/query'
import useRecordsFetcher from '@/routes/Gacha/hooks/useRecordsFetcher'
import useGlobalNotifier, { DefaultNotifierTimeouts } from '@/routes/Root/hooks/useGlobalNotifier'
import dayjs from '@/utilities/dayjs'
import { DataAction, GachaUrlContext } from './types'

/**
 * Access the gacha URL context state for the currently selected account.
 *
 * The context is provided by `GachaUrlProvider` and holds the gacha URL state
 * belonging to the account currently selected in the app (e.g. the cached URL
 * value, its creation time, and expiration info). Consumers use it to read the
 * cached URL and to decide whether it still needs to be (re)obtained.
 *
 * Must be called within a `GachaUrlProvider`; throws otherwise.
 */
export function useGachaUrl () {
  const state = use(GachaUrlContext)
  if (!state) {
    throw new Error('useGachaUrl must be used within an GachaUrlProvider')
  } else {
    return state
  }
}

enum ObtainGachaUrlStatus {
  Ok = 'Ok',
  Expired = 'Expired',
  Unavailable = 'Unavailable',
  Unobtainable = 'Unobtainable',
}

type ObtainGachaUrlResult
  = | { status: ObtainGachaUrlStatus.Ok, url: GachaUrl }
    | { status: ObtainGachaUrlStatus.Expired }
    | { status: ObtainGachaUrlStatus.Unavailable }
    | { status: ObtainGachaUrlStatus.Unobtainable }

/**
 * Obtains a valid gacha URL for the selected account.
 *
 * - Returns the cached URL if it is still valid.
 * - Otherwise requests a fresh one from webcaches.
 * - On `AuthkeyTimeout`, returns `{ status: ObtainGachaUrlStatus.Expired }` so the
 *   caller can clear the persisted URL fields.
 * - If there is no selected account, returns `{ status: ObtainGachaUrlStatus.Unavailable }`;
 *   the caller should neither fetch nor persist.
 * - If the request itself yields no URL (e.g. an invalid/forged `uid` that
 *   `fromWebcachesGachaUrl` cannot resolve), returns
 *   `{ status: ObtainGachaUrlStatus.Unobtainable }`. This is not expected in
 *   normal use; callers should treat it as a no-op.
 * - Any other error is rethrown; the caller persists nothing in that case.
 *
 * This hook performs **no** persistence — persistence is the caller's job.
 */
function useObtainGachaUrl (t: UseI18n['t']) {
  const { promise: promiseNotify } = useGlobalNotifier()
  const { selected } = useAccount()
  const url = useGachaUrl()

  return useCallback<() => Promise<ObtainGachaUrlResult>>(async () => {
    if (!selected) {
      return { status: ObtainGachaUrlStatus.Unavailable }
    }

    // Fast path: cached URL is still valid.
    if (url.value && !url.hasExpired) {
      console.debug('[GachaUrl] obtain: ok (cached)', { uid: selected.uid })
      return {
        status: ObtainGachaUrlStatus.Ok,
        url: {
          business: selected.business,
          owner: selected.uid,
          value: url.value,
          creationTime: url.creationTime,
        },
      }
    }

    const keyof = AccountBusiness[selected.business]
    const promise = promiseNotify(BusinessCommands.fromWebcachesGachaUrl({
      business: selected.business,
      uid: selected.uid,
      dataFolder: selected.dataFolder,
    }), {
      loading: {
        title: t('Obtain.Loading', { keyof }),
      },
      error (error) {
        if (isGachaUrlAuthkeyTimeout(error)) {
          return
        }

        return {
          dismissible: true,
          timeout: DefaultNotifierTimeouts.error * 2,
          title: t('Obtain.Error', { keyof }),
          body: extractErrorMessage(error),
        }
      },
    })

    try {
      const result = await promise
      // `null` means the command could not resolve a URL for the given input
      // (e.g. an invalid `uid`). Not an error, but nothing to hand back either.
      if (!result) {
        console.debug('[GachaUrl] obtain: unobtainable (command returned null)', { uid: selected.uid })
        return { status: ObtainGachaUrlStatus.Unobtainable }
      } else {
        return {
          status: ObtainGachaUrlStatus.Ok,
          url: result,
        }
      }
    } catch (error) {
      // AuthkeyTimeout is an expected business state (the authkey expired), not
      // a failure: treat it as "no valid URL" so the caller can clear the
      // persisted URL fields and stop, instead of surfacing an error.
      // Any other error must be rethrown as-is — swallowing it would be
      // mistaken for expiry and cause the caller to wipe valid URL data, and
      // would hide a real failure behind a null-ish result. This branch is the
      // only place that makes that decision, hence the explicit check.
      if (isGachaUrlAuthkeyTimeout(error)) {
        console.debug('[GachaUrl] obtain: expired (authkey timeout)', { uid: selected.uid })
        return { status: ObtainGachaUrlStatus.Expired }
      } else {
        throw error
      }
    }
  }, [promiseNotify, selected, t, url.creationTime, url.hasExpired, url.value])
}

function useFetchRecords (t: UseI18n['t']) {
  const { promise: promiseNotify } = useGlobalNotifier()
  // Destructure `fetch` rather than keeping the whole returned object: the
  // object is a new literal each render, so depending on it would invalidate
  // the memo below on every render. `fetch` itself is stable (see
  // `useRecordsFetcher`), so `[fetch]` is the correct, stable dep.
  const { isFetching, event, fetch } = useRecordsFetcher()
  const fetchRecords = useCallback(async (options: FetchRecordsOptions<AccountBusiness>) => {
    const keyof = AccountBusiness[options.business]
    const promise = promiseNotify(fetch(options), {
      loading: {
        title: t('Fetch.Loading', { keyof }),
      },
      success (value) {
        // Positive numbers are added, negative numbers are deleted
        value ??= 0

        const body = value >= 0 ? 'AddedBody' : 'DeletedBody'
        return {
          dismissible: true,
          timeout: DefaultNotifierTimeouts.success * 2,
          title: t('Fetch.Success.Title', { keyof }),
          body: t(`Fetch.Success.${body}`, {
            count: Math.abs(value),
          }),
        }
      },
      error (error) {
        return {
          dismissible: true,
          timeout: DefaultNotifierTimeouts.error * 2,
          title: t('Fetch.Error', { keyof }),
          body: extractErrorMessage(error),
        }
      },
    })

    return (await promise) ?? 0
  }, [fetch, promiseNotify, t])

  return {
    isFetching,
    event,
    fetchRecords,
  }
}

export function useAction () {
  const { t, constants: { gacha: customLocale } } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Toolbar.GachaUrl.Action' })
  const { selected } = useAccount()
  const stats = useGachaStats()

  const obtainGachaUrl = useObtainGachaUrl(t)
  const { isFetching, event: fetchEvent, fetchRecords } = useFetchRecords(t)
  const { mutateAsync: mutateProperties } = useUpdateAccountPropertiesMutation()

  // `busyRef` is the source of truth for the guard; `isBusy` only drives render.
  // They are updated together in `update`; do not read `isBusy` for guarding.
  const [isBusy, setBusy] = useState(false)
  const busyRef = useRef(false)

  // The action is disabled when any of the following holds:
  // - `!selected`: no account is selected, so there is nothing to update.
  // - `!stats`: stats are not available yet (still loading / no data), so the
  //   update has no baseline to work from.
  // - `isFetching`: a records fetch is already in flight (tracked by
  //   `useRecordsFetcher`), so starting another would be rejected anyway.
  // - `isBusy`: this action's own pipeline is running (render-side mirror of
  //   `busyRef`); kept here so the UI reflects the in-progress state.
  //
  // Note: `disabled` is for rendering only. The actual re-entrancy guard inside
  // `update` is `busyRef.current`, since event handlers must not depend on a
  // possibly-stale `isBusy` from their closure.
  const disabled = !selected || !stats || isFetching || isBusy
  const update = useCallback<MouseEventHandler>(async (evt) => {
    const saveToDatabase = evt.currentTarget
      .getAttribute(DataAction) as SaveToDatabase | null

    // Invalid state or busy
    if (!saveToDatabase || !selected || !stats || busyRef.current) {
      return
    }

    console.debug('[GachaUrl] Preparing to update gacha url with:', saveToDatabase)

    // Set busy
    busyRef.current = true
    setBusy(true)

    // Single place that writes account properties: merges the patch over the
    // current properties snapshot. Every persistence below goes through it.
    const persistProperties = (patch: Partial<NonNullable<Account['properties']>>) =>
      mutateProperties({
        business: selected.business,
        uid: selected.uid,
        properties: {
          ...selected.properties,
          ...patch,
        },
      })

    // Fetch records; on mid-fetch authkey expiry, clear the persisted URL
    // fields before rethrowing. Extracted so the main flow has no nested try —
    // this catch exists solely for the cleanup side effect.
    const fetchWithExpiryHandling = async (url: GachaUrl): Promise<number> => {
      try {
        return await fetchRecords({
          business: selected.business,
          uid: selected.uid,
          gachaUrl: url.value,
          gachaRanges: stats.gachaRanges,
          saveToDatabase,
        })
      } catch (error) {
        if (isGachaUrlAuthkeyTimeout(error)) {
          console.debug('[GachaUrl] fetch: authkey expired mid-fetch, clearing URL', { uid: selected.uid })
          await persistProperties({ gachaUrl: null, gachaUrlCreationTime: null })
        }

        // Rethrow: the caller must not proceed to record a successful update, and the
        // notifier error handler needs to see the original error.
        throw error
      }
    }

    // Pipeline
    try {
      // Step 1: obtain a valid URL (does not persist).
      const obtained = await obtainGachaUrl()
      switch (obtained.status) {
        case ObtainGachaUrlStatus.Unavailable:
        case ObtainGachaUrlStatus.Unobtainable:
          return
        case ObtainGachaUrlStatus.Expired:
          console.debug('[GachaUrl] update: authkey expired, clearing persisted URL', { uid: selected.uid })
          await persistProperties({ gachaUrl: null, gachaUrlCreationTime: null })
          return
        case ObtainGachaUrlStatus.Ok:
          break
      }

      // Step 2: fetch records.
      const changes = await fetchWithExpiryHandling(obtained.url)
      console.debug('[GachaUrl] fetch: done', { uid: selected.uid, changes })

      // Step 3: single successful write.
      await persistProperties({
        gachaUrl: obtained.url.value,
        gachaUrlCreationTime: obtained.url.creationTime,
        lastGachaRecordsUpdated: dayjs().toISOString(),
      })

      // Step 4: invalidate the gacha stats cache if records actually changed.
      if (changes !== 0) {
        console.debug('[GachaUrl] Invalidating stats gacha records cache...')
        invalidateGachaStatsQuery({
          business: selected.business,
          uid: selected.uid,
          customLocale,
        })
      }
    } catch (error) {
      // The notifier already surfaced a user-facing error (see
      // `notifier.promise` inside `obtainGachaUrl` / `fetchRecords`); this
      // catch exists only to keep the rejection from bubbling into React's
      // error boundary / window.onerror. Log at debug level for diagnosis.
      console.debug('[GachaUrl] update: aborted with error', error)
    } finally {
      // Clean
      busyRef.current = false
      setBusy(false)
    }
  }, [customLocale, fetchRecords, mutateProperties, obtainGachaUrl, selected, stats])

  return {
    isFetching,
    fetchEvent,
    disabled,
    update,
  }
}
