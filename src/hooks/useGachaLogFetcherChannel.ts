import { useState, useCallback } from 'react'
import { GachaLogItem } from '@/interfaces/models'
import Commands from '@/utilities/commands'
import { event } from '@tauri-apps/api'

interface Props {
  channelName: string
  gachaUrl: string
  gachaTypes?: Array<GachaLogItem['gachaType']>
}

// TODO: Performance

export default function useGachaLogFetcherChannel (props: Props) {
  const [error, setError] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [data, setData] = useState<GachaLogItem[]>([])
  const [busy, setBusy] = useState(false)

  const start = useCallback(async () => {
    setError(undefined)
    setData([])
    setBusy(true)
    try {
      const unlisten = await event.listen<
        { status: string } |
        { data: GachaLogItem[] }
      >(props.channelName, ({ payload }) => {
        if (!payload) return
        if ('status' in payload && typeof payload.status === 'string') {
          setStatus(payload.status)
        } else if ('data' in payload && Array.isArray(payload.data)) {
          setData((prev) => prev.concat(payload.data))
        }
      })
      try {
        await Commands.crateGachaLogFetcherChannel({ ...props })
      } finally {
        unlisten()
      }
    } catch (error) {
      setError(
        error instanceof Error || typeof error === 'object'
          ? (error as Error).message
          : error as string
      )
    } finally {
      setBusy(false)
    }
  }, [setError, setStatus, setData, setBusy, props])

  return {
    error,
    status,
    data,
    busy,
    start
  }
}
