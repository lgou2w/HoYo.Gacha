import { useCallback } from 'react'
import { listen } from '@tauri-apps/api/event'
import { useImmer } from 'use-immer'
import {
  CreateGachaRecordsFetcherChannelArgs,
  GachaRecordsFetcherChannelFragment,
  createGachaRecordsFetcherChannel,
} from '@/api/commands/business'
import { Business } from '@/interfaces/Business'
import { Overwrite } from '@/interfaces/declares'

// eventChannel must be provided
type FetchArgs<T extends Business> = Overwrite<CreateGachaRecordsFetcherChannelArgs<T>, { eventChannel: string }>

type FetchFragment<T extends Business> = 'Idle' | GachaRecordsFetcherChannelFragment<T>

export default function useGachaRecordsFetcher<T extends Business> () {
  const [state, produce] = useImmer<{
    isFetching: boolean
    fragment: FetchFragment<T>,
  }>({
    isFetching: false,
    fragment: 'Idle',
  })

  const fetch: (args: FetchArgs<T>) => Promise<Awaited<ReturnType<typeof createGachaRecordsFetcherChannel<T>>> | null> = useCallback(async (args) => {
    if (state.isFetching) {
      return null
    }

    // Reset state
    produce({
      isFetching: false,
      fragment: 'Idle',
    })

    try {
      const unlisten = await listen<GachaRecordsFetcherChannelFragment<T>>(args.eventChannel, (event) => {
        produce((draft) => {
          (draft.fragment as FetchFragment<T>) = event.payload
        })
      })

      try {
        return await createGachaRecordsFetcherChannel(args)
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
