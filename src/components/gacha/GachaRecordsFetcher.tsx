import React from 'react'
import { useImmer } from 'use-immer'
import { useStatefulAccountContext } from '@/hooks/useStatefulAccount'
import { useGachaRecordsContext, useRefetchGachaRecordsFn } from '@/hooks/useGachaRecords'
import useGachaRecordsFetcher from '@/hooks/useGachaRecordsFetcher'
import PluginGacha from '@/utilities/plugin-gacha'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// TODO: temp test code
export default function GachaRecordsFetcher () {
  const { accounts, selectedAccountUid } = useStatefulAccountContext()
  const gachaRecords = useGachaRecordsContext()
  const fetcher = useGachaRecordsFetcher()
  const refetchGachaRecords = useRefetchGachaRecordsFn()
  const [state, produceState] = useImmer({ error: undefined as string | undefined, busy: false })

  const handleClick = React.useCallback(async () => {
    if (!gachaRecords) return
    produceState((draft) => {
      draft.error = undefined
      draft.busy = true
    })
    try {
      const { facet, uid, namedValues } = gachaRecords
      const gameDataDir = accounts[selectedAccountUid!].gameDataDir
      const gachaUrl = await PluginGacha.findGachaUrlOfLatest(facet, gameDataDir)
      await fetcher.pull(facet, uid, {
        gachaUrl,
        gachaTypeAndLastEndIdMappings: {
          [namedValues.newbie.gachaType]: namedValues.newbie.lastEndId ?? null,
          [namedValues.permanent.gachaType]: namedValues.permanent.lastEndId ?? null,
          [namedValues.character.gachaType]: namedValues.character.lastEndId ?? null,
          [namedValues.weapon.gachaType]: namedValues.weapon.lastEndId ?? null
        },
        eventChannel: 'gachaRecords-fetcher',
        saveToStorage: true
      })
      await refetchGachaRecords()
    } catch (e) {
      produceState((draft) => {
        draft.error = (e as Error).message || String(e)
      })
    } finally {
      produceState((draft) => {
        draft.busy = false
      })
    }
  }, [gachaRecords, fetcher, produceState])

  return (
    <Box>
      <Button onClick={handleClick} disabled={state.busy}>获取数据</Button>
      <Typography variant="h6">
        状态：{state.error || ((fetcher.currentFragment as any).data ? 'data...' : JSON.stringify(fetcher.currentFragment))}
      </Typography>
      {/* {fetcher.fragments.map((fragment, index) => (
        <Typography key={index}>{JSON.stringify(fragment)}</Typography>
      ))} */}
    </Box>
  )
}
