import { PropsWithChildren } from 'react'
import { useI18n } from '@/i18n'
import { useAccount } from '@/routes/Gacha/contexts/Account/hooks'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import { useGachaStatsSuspenseQuery } from './hooks'
import { GachaStatsContext } from './types'

export default function GachaStatsProvider (props: PropsWithChildren) {
  const i18n = useI18n()
  const business = useBusiness()
  const { selected } = useAccount()
  const { data } = useGachaStatsSuspenseQuery({
    business: business.value,
    uid: selected?.uid,
    customLocale: i18n.constants.gacha,
  })

  return (
    <GachaStatsContext value={data}>
      {props.children}
    </GachaStatsContext>
  )
}
