import { useCallback, useRef, useState } from 'react'
import { Channel } from '@tauri-apps/api/core'
import { produce } from 'immer'
import { AccountBusiness } from '@/api/Account'
import { BusinessCommands, FetchRecordsEvent, FetchRecordsOptions } from '@/routes/Gacha/api/business'

interface RecordsFetcherState {
  isFetching: boolean
  event: FetchRecordsEvent | null
}

/**
 * Fetches gacha records through `BusinessCommands.fetchRecords`, tracking
 * progress via a Tauri `Channel`.
 *
 * Concurrency: only one fetch may run at a time. A second call while a fetch
 * is in flight is rejected and resolves to `null` (callers treat it as a no-op).
 * Progress `event` is reset when a fetch starts and cleared again when it
 * finishes, so consumers see events only while `isFetching` is true.
 *
 * **Stability note**: the returned object is a fresh literal on every render,
 * so it is *not* a stable reference. Consumers that pass `fetch` into
 * `useCallback`/`useEffect` deps must **destructure it first** and depend on
 * `fetch` alone, not on the whole object — otherwise the dep changes every
 * render and the memo silently breaks. `fetch` itself is stable because it is
 * memoized with a stable `updateState` (`useCallback` with `[]`).
 *
 * @returns `{ isFetching, event, fetch }` — `fetch` resolves to the command's
 *          result, or `null` if skipped due to an in-flight fetch.
 */
export default function useRecordsFetcher<T extends AccountBusiness> () {
  const [state, setState] = useState<RecordsFetcherState>({
    isFetching: false,
    event: null,
  })

  // Stable updater: mutate a draft via immer, then commit through setState.
  // The functional form guarantees we build on the latest `prev`, so concurrent
  // updates (e.g. Channel callbacks) don't clobber each other. Empty deps keep
  // it referentially stable across renders.
  const updateState = useCallback((recipe: (draft: RecordsFetcherState) => void) => {
    setState((prev) => produce(prev, recipe))
  }, [])

  // Ref mirrors `isFetching` so `fetch` can guard against concurrent calls
  // without reading a stale `isFetching` from its closure. State drives render;
  // ref drives the guard.
  const isFetchingRef = useRef(false)

  const fetch = useCallback(async (options: FetchRecordsOptions<T>) => {
    // Concurrency guard: a second call while one is in flight is a no-op.
    if (isFetchingRef.current) {
      return null
    }

    isFetchingRef.current = true
    updateState((draft) => {
      draft.isFetching = true
      draft.event = null // clear stale progress from a previous run
    })

    const eventChannel = new Channel<FetchRecordsEvent>((event) => {
      updateState((draft) => {
        draft.event = event
      })
    })

    try {
      return await BusinessCommands.fetchRecords({
        eventChannel,
        options,
      })
    } finally {
      isFetchingRef.current = false
      updateState((draft) => {
        draft.isFetching = false
        draft.event = null
      })
    }

    // `updateState` is stable, so `fetch` is stable across renders. This is
    // what makes it safe to list `fetch` alone in consumer dep arrays.
  }, [updateState])

  return {
    isFetching: state.isFetching,
    event: state.event,
    fetch,
  }
}
