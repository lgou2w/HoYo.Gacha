import React from 'react'
import { event } from '@tauri-apps/api'
import { useImmer } from 'use-immer'
import { GenshinGachaRecord, StarRailGachaRecord } from '@/interfaces/gacha'
import PluginGacha from '@/utilities/plugin-gacha'

type Fragment =
  'sleeping' |
  { ready: string } |
  { pagination: number } |
  { data: Array<GenshinGachaRecord | StarRailGachaRecord> } |
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

    const fragments: Fragment[] = []
    const [,, { eventChannel }] = args
    try {
      const unlisten = await event.listen<Fragment>(eventChannel, ({ payload }) => {
        produceState((draft) => {
          fragments.push(payload)
          draft.current = payload
        })
      })

      try {
        await PluginGacha.pullAllGachaRecords(...args)
      } finally {
        unlisten()
      }
      return fragments
    } catch (error) {
      return Promise.reject(error)
    }
  }, [produceState])

  return {
    currentFragment: current,
    pull
  }
}
