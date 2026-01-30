import { PropsWithChildren, useMemo } from 'react'
import { useI18n } from '@/i18n'
import { useBusiness } from '@/pages/Gacha/contexts/Business'
import { useSelectedAccount } from '@/pages/Gacha/queries/accounts'
import { usePrettizedRecordsSuspenseQuery } from '@/pages/Gacha/queries/prettizedRecords'
import { PrettiedRecordsState, PrettizedRecordsContext } from './context'

export default function PrettizedRecordsProvider (props: PropsWithChildren) {
  const i18n = useI18n()
  const business = useBusiness()
  const selected = useSelectedAccount(business.keyof)
  const { data } = usePrettizedRecordsSuspenseQuery(
    business.value,
    selected?.uid,
    i18n.constants.gacha,
  )

  const state = useMemo<PrettiedRecordsState>(
    () => ({
      business,
      selected,
      data,
    }),
    [selected, business, data],
  )

  return (
    <PrettizedRecordsContext value={state}>
      {props.children}
    </PrettizedRecordsContext>
  )
}
