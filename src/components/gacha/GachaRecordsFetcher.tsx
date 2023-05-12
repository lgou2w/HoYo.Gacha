import React from 'react'
import { useStatefulAccountContext } from '@/hooks/useStatefulAccount'
import { useGachaRecordsContext } from '@/hooks/useGachaRecords'
import useGachaRecordsFetcher from '@/hooks/useGachaRecordsFetcher'
import PluginGacha from '@/utilities/plugin-gacha'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// TODO: test
export default function GachaRecordsFetcher () {
  const { accounts, selectedAccountUid } = useStatefulAccountContext()
  const gachaRecords = useGachaRecordsContext()
  const fetcher = useGachaRecordsFetcher()
  const handleClick = React.useCallback(async () => {
    if (!gachaRecords) return
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
      saveToStorage: false
    })
  }, [gachaRecords, fetcher])

  return (
    <Box>
      <Button onClick={handleClick}>pull</Button>
      <Typography variant="h6">{JSON.stringify(fetcher.currentFragment)}</Typography>
      {fetcher.fragments.map((fragment, index) => (
        <Typography key={index}>{JSON.stringify(fragment)}</Typography>
      ))}
    </Box>
  )
}
