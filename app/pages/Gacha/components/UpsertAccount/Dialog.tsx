import { forwardRef, useCallback, useImperativeHandle } from 'react'
import { Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle } from '@fluentui/react-components'
import { useImmer } from 'use-immer'
import { Account, AccountBusiness } from '@/api/schemas/Account'
import useNotifier from '@/hooks/useNotifier'
import { WithTransKnownNs, useI18n } from '@/i18n'
import UpsertAccountForm, { UpsertAccountFormProps } from './Form'

const UpsertAccountDialog = forwardRef<
  { open (owner: Account | null): void },
  Omit<UpsertAccountFormProps, 'owner' | 'onCancel' | 'onSuccess'>
>(function UpsertAccountDialog (props, ref) {
  const [{ owner, open }, produceState] = useImmer({
    owner: null as Account | null,
    open: false,
  })

  useImperativeHandle(ref, () => ({
    open: (owner) => produceState({
      owner,
      open: true,
    }),
  }), [produceState])

  const { t } = useI18n(WithTransKnownNs.GachaPage)
  const notifier = useNotifier()
  const context = !owner ? 'add' : 'edit'

  const handleSuccess = useCallback<Required<UpsertAccountFormProps>['onSuccess']>((data) => {
    produceState((draft) => {
      draft.open = false
    })

    notifier.success(t('UpsertAccount.Dialog.Success', {
      context,
      keyof: AccountBusiness[props.business],
      identity: data.properties?.displayName || data.uid,
    }))
  }, [context, notifier, produceState, props.business, t])

  return (
    <Dialog modalType="alert" open={open}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {t('UpsertAccount.Dialog.Title', {
              context,
              keyof: AccountBusiness[props.business],
            })}
          </DialogTitle>
          <DialogContent>
            <UpsertAccountForm
              {...props}
              owner={owner}
              onSuccess={handleSuccess}
              onCancel={() => produceState((draft) => {
                draft.open = false
              })}
            />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
})

export default UpsertAccountDialog
