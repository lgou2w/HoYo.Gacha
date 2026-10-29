import { PropsWithChildren, useCallback, useMemo, useRef } from 'react'
import { useAccount, useSelectedAccountUidMutation } from '@/routes/Gacha/contexts/Account/hooks'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import { AccountMenuContext, AccountMenuContextValue, CheckedKey } from './types'
import { UpsertAccountDialogHandle } from '../../UpsertAccount/Dialog'

export default function AccountMenuProvider (props: PropsWithChildren) {
  const business = useBusiness()
  const { selected } = useAccount()
  const {
    mutate: selectedUidMutate,
    isPending: selectedUidPending,
  } = useSelectedAccountUidMutation()

  const mutation = useMemo<AccountMenuContextValue['mutation']>(
    () => ({ change: selectedUidMutate, isPending: selectedUidPending }),
    [selectedUidMutate, selectedUidPending],
  )

  const handleSelect = useCallback<AccountMenuContextValue['menu']['handleSelect']>((_, data) => {
    if (data.name != CheckedKey) {
      return
    }

    const checkedUid = +data.checkedItems[0]
    if (checkedUid === selected?.uid) {
      return
    }

    selectedUidMutate({
      business: business.value,
      data: checkedUid,
    })
  }, [business.value, selected?.uid, selectedUidMutate])

  const menu = useMemo<AccountMenuContextValue['menu']>(
    () => ({
      checkedValues: {
        [CheckedKey]: selected
          ? [String(selected.uid)]
          : [],
      },
      handleSelect,
    }),
    [handleSelect, selected],
  )

  const upsertDialogRef = useRef<UpsertAccountDialogHandle>(null)

  const state = useMemo<AccountMenuContextValue>(
    () => ({ mutation, menu, upsertDialogRef }),
    [menu, mutation, upsertDialogRef],
  )

  return (
    <AccountMenuContext value={state}>
      {props.children}
    </AccountMenuContext>
  )
}
