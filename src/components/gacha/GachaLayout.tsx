import React, { useEffect, useRef } from 'react'
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

  // HACK: Clear alert if switching to another account
  const selectedAccountUidRef = useRef(selectedAccountUid)
  useEffect(() => {
    if (selectedAccountUidRef.current !== selectedAccountUid) {
      produceState((prev) => {
        prev.alert = undefined
      })
    }

    selectedAccountUidRef.current = selectedAccountUid
  }, [selectedAccountUid])

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
        // TODO: optimize error handling
        const severity = error ? 'error' : 'success'
        if (error && (error instanceof Error || typeof error === 'object')) {
          const msg = (error as { message: string }).message
          const identifier = (error as { identifier?: string }).identifier
          const knownMessage = identifier ? KnownErrorIdentifiers[identifier] : undefined
          const appendMessage = Array.isArray(knownMessage)
          let pretty = appendMessage ? knownMessage[0] : knownMessage
          if (pretty && appendMessage) {
            let index: number
            if ((index = msg.indexOf(':')) !== -1) {
              pretty += msg.substring(index)
            } else if (appendMessage) {
              pretty += msg
            }
          }

          message = pretty || msg
        } else if (error) {
          message = String(error)
        }

        if (error) {
          console.error('GachaLayoutContext.alert: ', error)
        }

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
        facet={facet}
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

const KnownErrorIdentifiers: Record<string, string | [string]> = {
  INTERNAL_CRATE: ['内部错误'],
  WEB_CACHES: '读取硬盘缓存失败：未找到有效文件夹！请检查账号的游戏数据文件夹是否正确！',
  ILLEGAL_GACHA_URL: '无效的抽卡链接！',
  VACANT_GACHA_URL: '未找到有效的抽卡链接。请尝试在游戏内打开抽卡历史记录界面！',
  TIMEOUTD_GACHA_URL: '抽卡链接已经过期失效。请重新在游戏内打开抽卡历史记录界面！',
  VISIT_TOO_FREQUENTLY_GACHA_URL: '请求获取抽卡记录 API 速率过快！请稍等几秒后再次重试！',
  UIGF_OR_SRGF_SERDE_JSON: ['待导入的 UIGF 或 SRGF 数据文件格式不正确'],
  UIGF_OR_SRGF_MISMATCHED_UID: ['待导入的 UIGF 或 SRGF 数据 UID 与当前账号不匹配'],
  UIGF_OR_SRGF_INVALID_FIELD: ['待导入的 UIGF 或 SRGF 数据中存在无效的字段']
}
