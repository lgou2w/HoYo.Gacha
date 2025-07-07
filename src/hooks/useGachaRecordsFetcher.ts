import { useCallback } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useImmer } from 'use-immer'
import {
  CreateGachaRecordsFetcherArgs,
  GachaRecordsFetcherFragment,
  createGachaRecordsFetcher,
} from '@/api/commands/business'
import { Business } from '@/interfaces/Business'
import { Overwrite } from '@/interfaces/declares'

// eventChannel must be provided
export type GachaRecordsFetcherFetchArgs<T extends Business> =
  Overwrite<CreateGachaRecordsFetcherArgs<T>, { eventChannel: string }>

export type GachaRecordsFetcherFetchFragment<T extends Business> =
  'Idle' | GachaRecordsFetcherFragment<T>

export default function useGachaRecordsFetcher<T extends Business> () {
  const [state, produce] = useImmer<{
    isFetching: boolean
    fragment: GachaRecordsFetcherFetchFragment<T>,
  }>({
    isFetching: false,
    fragment: 'Idle',
  })

  const fetch: (args: GachaRecordsFetcherFetchArgs<T>) => Promise<Awaited<ReturnType<typeof createGachaRecordsFetcher<T>>> | null> = useCallback(async (args) => {
    if (state.isFetching) {
      return null
    }

    produce({
      isFetching: true,
      fragment: 'Idle',
    })

    try {
      const unlisten = await listen<GachaRecordsFetcherFragment<T>>(args.eventChannel, (event) => {
        produce((draft) => {
          (draft.fragment as GachaRecordsFetcherFetchFragment<T>) = event.payload
        })
      })

      try {
        return await createGachaRecordsFetcher(args)
      } finally {
        unlisten()
      }
    } catch (error) {
      return Promise.reject(error)
    } finally {
      produce((draft) => {
        draft.isFetching = false
      })
    }
  }, [state.isFetching, produce])

  return {
    state,
    fetch,
  }
}
