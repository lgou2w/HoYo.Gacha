import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import GachaActions from '@/components/gacha/gacha-actions'
import GachaTab from '@/components/gacha/gacha-tab'
import GachaTabOverview from '@/components/gacha/gacha-tab-overview'
import { useStatefulSettings } from '@/hooks/useStatefulSettings'
import Commands from '@/utilities/commands'

const Tabs = ['总览', '统计', '数据']

export default function GachaPage () {
  const { selectedAccount } = useStatefulSettings()

  const [tab, setTab] = useState(0)
  const gachaLogs = useQuery({
    queryKey: ['gacha-logs', selectedAccount?.uid],
    queryFn: () => {
      console.debug('Fetch gacha logs:', selectedAccount?.uid)
      return selectedAccount && Commands.findGachaLogsByUID({ uid: selectedAccount.uid })
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })

  return (
    <Box className="page page-gacha">
      <GachaActions
        tabs={Tabs}
        tabIndex={tab}
        onTabChange={(_, newValue) => setTab(newValue)}
        disabled={!selectedAccount}
      />
      <Box marginTop={2}>
        {gachaLogs.isFetching && <Typography variant="caption">数据加载中...</Typography>}
        {gachaLogs.data && Tabs.map((label, index) => (
          <GachaTab key={index} value={tab} index={index}>
            {index === 0 ? <GachaTabOverview data={gachaLogs.data!} /> : label}
          </GachaTab>
        ))}
      </Box>
    </Box>
  )
}
