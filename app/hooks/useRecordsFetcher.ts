import { useCallback, useRef } from 'react'
import { Channel } from '@tauri-apps/api/core'
import { useImmer } from 'use-immer'
import BusinessCommands, { FetchRecordsArgs, FetchRecordsEvent } from '@/api/commands/business'
import { AccountBusiness } from '@/api/schemas/Account'

export type RecordsFetcherFetchArgs<T extends AccountBusiness>
  = Omit<FetchRecordsArgs<T>, 'eventChannel'>

export type RecordsFetcherFetch<T extends AccountBusiness>
  = (args: RecordsFetcherFetchArgs<T>) => Promise<
    | Awaited<ReturnType<typeof BusinessCommands.fetchRecords>>
    | null
    | undefined
  >

export default function useRecordsFetcher<T extends AccountBusiness> () {
  const [{ isFetching, event }, updateState] = useImmer({
    isFetching: false,
    event: null as FetchRecordsEvent | null,
  })

  const isFetchingRef = useRef(false)
  const fetch = useCallback<RecordsFetcherFetch<T>>(async (args) => {
    if (isFetchingRef.current) {
      return null
    }

    isFetchingRef.current = true
    updateState({
      isFetching: true,
      event: null,
    })

    const eventChannel = new Channel<FetchRecordsEvent>((message) => {
      updateState((draft) => {
        (draft.event as FetchRecordsEvent) = message
      })
    })

    try {
      return await BusinessCommands.fetchRecords({
        ...args,
        eventChannel,
      })
    } catch (error) {
      return Promise.reject(error)
    } finally {
      isFetchingRef.current = false
      updateState((draft) => {
        draft.isFetching = false
        draft.event = null
      })
    }
  }, [updateState])

  return {
    isFetching,
    event,
    fetch,
  }
}
