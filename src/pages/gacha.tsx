import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Page from '@/components/page'
import GachaAlert, { GachaAlertProps } from '@/components/gacha/alert'
import GachaActionsBar from '@/components/gacha/actions-bar'
import { Actions, GachaActionsCallback } from '@/components/gacha/actions-bar/types'
import GachaTabOverview from '@/components/gacha/tab-overview'
import GachaTabChart from '@/components/gacha/tab-chart'
import GachaTabData from '@/components/gacha/tab-data'
import useStatefulSettings from '@/hooks/useStatefulSettings'
import useGachaLogsQuery from '@/hooks/useGachaLogsQuery'

export default function PageGacha () {
  const { selectedAccount, updateAccount } = useStatefulSettings()
  const [alert, setAlert] = useState<GachaAlertProps['data']>(undefined)
  const [tab, setTab] = useState(0)

  const handleError = useCallback((error: Error | string | unknown) => {
    if (!error) return
    setAlert({
      severity: 'error',
      message: error instanceof Error || typeof error === 'object'
        ? (error as Error).message
        : error as string
    })
  }, [setAlert])

  const query = useGachaLogsQuery({
    uid: selectedAccount?.uid,
    onError: handleError
  })

  const handleAction = useCallback<GachaActionsCallback['onAction']>((error, action, message) => {
    if (error) return handleError(error)
    if (message) {
      setAlert({ severity: 'success', message })
    }
    if (action === Actions.GachaFetch || action === Actions.GachaImport) {
      query.refetch()
    }
  }, [query, handleError, setAlert])

  if (!selectedAccount) {
    return (
      <Page>
        <GachaAlert data={{ severity: 'error', message: '还没有任何可用账号。请先添加一个账号！' }} />
        <Box>
          <Button component={Link} to="/account" variant="outlined">账号管理</Button>
        </Box>
      </Page>
    )
  }

  return (
    <Page>
      <GachaAlert data={alert} onClose={() => setAlert(undefined)} />
      <GachaActionsBar
        urlProps={{
          account: selectedAccount,
          onAction: handleAction
        }}
        fetchProps={{
          account: selectedAccount,
          onAction: handleAction,
          updateAccount,
          fetcherChannelTypesArguments: query.data?.fetcherChannelTypeArguments
        }}
        tabsProps={{
          tabs: ['总览', '数据', '统计'],
          value: tab,
          onChange: (_, newValue) => setTab(newValue)
        }}
        extProps={{
          account: selectedAccount,
          onAction: handleAction
        }}
      />
      {query.isLoading && <Typography variant="body2">数据加载中...</Typography>}
      {query.data && {
        0: <GachaTabOverview account={selectedAccount} data={query.data} />,
        1: <GachaTabData />,
        2: <GachaTabChart />
      }[tab]}
    </Page>
  )
}
