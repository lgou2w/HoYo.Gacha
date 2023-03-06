import React, { useCallback, useEffect, useMemo, useReducer } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import GachaActions, { Props as GachaActionsProps } from '@/components/gacha/gacha-actions'
import GachaTab from '@/components/gacha/gacha-tab'
import GachaTabOverview from '@/components/gacha/gacha-tab-overview'
import { GachaLogItem } from '@/interfaces/models'
import useStatefulSettings from '@/hooks/useStatefulSettings'
import Commands from '@/utilities/commands'
import dayjs from '@/utilities/dayjs'

const Tabs = ['总览', '统计', '数据']

export default function PageGacha () {
  const { selectedAccount } = useStatefulSettings()

  type Action =
    | { type: 'setTab', payload: number }
    | { type: 'setAlert', payload?: { severity: 'success' | 'error', message?: string } }
    | { type: 'setBusy', payload: boolean }

  const initialState = { tab: 0, alert: undefined, busy: false }
  const [state, dispatch] = useReducer((state = initialState, action: Action) => {
    switch (action.type) {
      case 'setTab': return { ...state, tab: action.payload }
      case 'setAlert': return { ...state, alert: action.payload }
      case 'setBusy': return { ...state, busy: action.payload }
      default: return state
    }
  }, initialState)

  const handleError = useCallback<Required<GachaActionsProps>['onError']>((error) => {
    dispatch({
      type: 'setAlert',
      payload: {
        severity: 'error',
        message: '错误：' + (error instanceof Error || typeof error === 'object'
          ? error.message
          : error)
      }
    })
  }, [dispatch])

  const gachaLogs = useQuery({
    queryKey: ['gacha-logs', selectedAccount?.uid],
    queryFn: () => {
      if (!selectedAccount) {
        return Promise.resolve([])
      } else {
        console.debug('Fetch gacha logs:', selectedAccount.uid)
        return Commands.findGachaLogsByUID({ uid: selectedAccount.uid })
      }
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    onError: handleError
  })

  const {
    gachaTotal,
    gachaTypeGroups,
    gachaFirstTime,
    gachaLastTime
  } = useMemo(() => {
    const data = gachaLogs.data
    let gachaTypeGroups: Record<GachaLogItem['gachaType'], GachaLogItem[]> = { 100: [], 200: [], 301: [], 302: [], 400: [] }
    if (!data) {
      return {
        gachaTotal: 0,
        gachaTypeGroups,
        gachaFirstTime: undefined,
        gachaLastTime: undefined
      }
    } else {
      gachaTypeGroups = data.reduce((acc, value) => {
        if (!acc[value.gachaType]) acc[value.gachaType] = []
        acc[value.gachaType].push(value)
        return acc
      }, gachaTypeGroups)

      return {
        gachaTotal: data.length,
        gachaTypeGroups,
        gachaFirstTime: data[0]?.time,
        gachaLastTime: data[data.length - 1]?.time
      }
    }
  }, [gachaLogs])

  const handleSuccess = useCallback<Required<GachaActionsProps>['onSuccess']>((action, message) => {
    dispatch({
      type: 'setAlert',
      payload: message ? { severity: 'success', message } : undefined
    })
    if (action === 'gacha-fetch' || action === 'gacha-import') {
      console.debug('Refetch gacha logs...')
      dispatch({ type: 'setBusy', payload: true })
      gachaLogs
        .refetch()
        .finally(() => dispatch({ type: 'setBusy', payload: false }))
    }
  }, [dispatch, gachaLogs])

  useEffect(() => {
    if (state.alert) {
      const timeout = window.setTimeout(() => {
        dispatch({ type: 'setAlert', payload: undefined })
      }, state.alert.severity === 'error' ? 10_000 : 5_000)
      return () => { window.clearTimeout(timeout) }
    }
  }, [state.alert])

  return (
    <Box className="page page-gacha">
      {state.alert && (
        <Alert
          severity={state.alert.severity}
          onClose={() => dispatch({ type: 'setAlert', payload: undefined })}
          sx={{ marginBottom: 2 }}
        >
          {state.alert.message}
        </Alert>
      )}
      {selectedAccount
        ? (<>
          <GachaActions
            account={selectedAccount}
            data={gachaTypeGroups}
            tabs={Tabs}
            tabIndex={state.tab}
            onTabChange={(_, newValue) => dispatch({ type: 'setTab', payload: newValue })}
            onSuccess={handleSuccess}
            onError={handleError}
            disabled={state.busy}
          />
          <Box marginY={2}>
            <Typography variant="subtitle2" color="grey.600">
              <Typography component="span" variant="inherit">最近祈愿记录更新日期：</Typography>
              <Typography component="span" variant="inherit">
                {selectedAccount.lastGachaUpdated
                  ? dayjs(selectedAccount.lastGachaUpdated).format('LLLL')
                  : '无'}
              </Typography>
            </Typography>
          </Box>
          <Box>
            {gachaLogs.isFetching && <Typography variant="caption">数据加载中...</Typography>}
            {gachaLogs.data && Tabs.map((label, index) => (
              <GachaTab key={index} value={state.tab} index={index}>
                {
                  index === 0
                    ? <GachaTabOverview
                        total={gachaTotal}
                        data={gachaTypeGroups}
                        firstTime={gachaFirstTime}
                        lastTime={gachaLastTime}
                      />
                    : label
                }
              </GachaTab>
            ))}
          </Box>
          </>)
        : (<>
            <Typography variant="h6" color="error">
              还没有任何可用账号。请先添加一个账号！
            </Typography>
            <Button component={Link} to="/account" variant="outlined">
              账号管理
            </Button>
          </>)
      }
    </Box>
  )
}
