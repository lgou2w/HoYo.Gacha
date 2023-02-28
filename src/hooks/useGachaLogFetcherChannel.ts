import { useState, useCallback } from 'react'
import { GachaLogItem } from '@/interfaces/models'
import Commands from '@/utilities/commands'
import { event } from '@tauri-apps/api'

interface Props {
  channelName: string
  gachaUrl: string
  gachaTypes?: Array<GachaLogItem['gachaType']>
  intoDatabase?: boolean
}

// TODO: Performance

export default function useGachaLogFetcherChannel (props: Props) {
  const [status, setStatus] = useState<string | undefined>()
  const [data, setData] = useState<GachaLogItem[]>([])

  const start: () => Promise<void> = useCallback(async () => {
    setData([])
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
      return Promise.reject(error)
    }
  }, [setStatus, setData, props])

  return {
    status,
    data,
    start
  }
}
