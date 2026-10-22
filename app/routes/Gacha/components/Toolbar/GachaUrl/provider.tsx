import { PropsWithChildren, useMemo } from 'react'
import { useI18n } from '@/i18n'
import { useAccount } from '@/routes/Gacha/contexts/Account/hooks'
import { GachaUrlContext, GachaUrlContextValue } from './types'

export default function GachaUrlProvider (props: PropsWithChildren) {
  const { dayjs } = useI18n()
  const { selected } = useAccount()

  const state = useMemo<GachaUrlContextValue>(() => {
    const value = selected?.properties?.gachaUrl
    const creationTime = selected?.properties?.gachaUrlCreationTime

    // HACK: The Gacha url is valid for 1 day.
    const deadline = creationTime
      ? dayjs(creationTime).add(1, 'day')
      : undefined

    // If deadline is defined and is before now, it has expired.
    const hasExpired = !!deadline && deadline.isBefore()

    return {
      value,
      creationTime,
      deadline,
      hasExpired,
    }
  }, [dayjs, selected?.properties?.gachaUrl, selected?.properties?.gachaUrlCreationTime])

  return (
    <GachaUrlContext value={state}>
      {props.children}
    </GachaUrlContext>
  )
}
