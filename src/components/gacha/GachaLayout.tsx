import React from 'react'
import { useImmer } from 'use-immer'
import { useStatefulAccountContext } from '@/hooks/useStatefulAccount'
import { useGachaRecordsQuery } from '@/hooks/useGachaRecordsQuery'
import { GachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import GachaToolbar from '@/components/gacha/toolbar'
import GachaOverview from '@/components/gacha/overview'
import GachaAnalysis from '@/components/gacha/analysis'
import GachaChart from '@/components/gacha/chart'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'

export default function GachaLayout () {
  const { facet, accounts, selectedAccountUid } = useStatefulAccountContext()
  const {
    data: gachaRecords,
    isLoading,
    isError,
    error
  } = useGachaRecordsQuery(facet, selectedAccountUid)

  // Layout state
  const [{ tab, alert }, produceState] = useImmer({
    tab: 0,
    alert: undefined as {
      severity: 'success' | 'error'
      message: string
    } | undefined
  })

  // Check selected account
  const selectedAccount = selectedAccountUid ? accounts[selectedAccountUid] : null
  if (!selectedAccount) {
    return (
      <Typography color="error">{
        Object.keys(accounts).length > 0
          ? '当前没有选中的账号。请先选择一个账号！'
          : '还没有任何可用账号。请先添加一个账号！'
      }</Typography>
    )
  }

  // TODO: loading and error customization
  if (isLoading) return <Typography>加载数据中...</Typography>
  if (isError) return <Typography>{error instanceof Error ? error.message : String(error)}</Typography>
  if (!gachaRecords) throw new Error('gachaRecords is null') // never!

  return (
    <GachaLayoutContext.Provider value={{
      facet,
      selectedAccount,
      gachaRecords,
      alert (error, message) {
        const severity = error ? 'error' : 'success'
        message = error
          ? error instanceof Error || typeof error === 'object'
            ? KnownErrorIdentifiers[(error as { identifier: string }).identifier] || (error as Error).message
            : String(error)
          : message
        produceState((draft) => {
          draft.alert = message
            ? { severity, message }
            : undefined
        })
      }
    }}>
      {alert && <Alert
        severity={alert.severity}
        onClose={() => produceState((draft) => { draft.alert = undefined })}>
          {alert?.message}
        </Alert>
      }
      <GachaToolbar
        ActionTabsProps={{
          tabs: ['概览', '分析', '统计'],
          value: tab,
          onChange: (_, newValue) => produceState((draft) => {
            draft.tab = newValue
          })
        }}
      />
      {{
        0: <GachaOverview />,
        1: <GachaAnalysis />,
        2: <GachaChart />
      }[tab]}
    </GachaLayoutContext.Provider>
  )
}

const KnownErrorIdentifiers: Record<string, string> = {
  ILLEGAL_GACHA_URL: '无效的抽卡链接！',
  VACANT_GACHA_URL: '未找到有效的抽卡链接。请尝试在游戏内打开抽卡历史记录界面！'
}
