import React from 'react'
import { event } from '@tauri-apps/api'
import { useImmer } from 'use-immer'
import { GenshinGachaRecord, StarRailGachaRecord, ZenlessZoneZeroGachaRecord } from '@/interfaces/gacha'
import PluginGacha from '@/utilities/plugin-gacha'

type Fragment =
  'sleeping' |
  { ready: string } |
  { pagination: number } |
  { data: Array<GenshinGachaRecord | StarRailGachaRecord | ZenlessZoneZeroGachaRecord> } |
  'finished'

export default function useGachaRecordsFetcher () {
  const [{ current }, produceState] = useImmer<{
    current: 'idle' | Fragment
  }>({
    current: 'idle'
  })

  const pull = React.useCallback(async (
    ...args: Parameters<typeof PluginGacha.pullAllGachaRecords>
  ) => {
    // reset state
    produceState((draft) => {
      draft.current = 'idle'
    })

    const [,, { eventChannel }] = args
    try {
      const unlisten = await event.listen<Fragment>(eventChannel, ({ payload }) => {
        produceState((draft) => {
          draft.current = payload
        })
      })

      try {
        return await PluginGacha.pullAllGachaRecords(...args)
      } finally {
        unlisten()
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }, [produceState])

  return {
    currentFragment: current,
    pull
  }
}
