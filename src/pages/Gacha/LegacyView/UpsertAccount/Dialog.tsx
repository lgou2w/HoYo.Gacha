import React, { ComponentProps, ForwardRefRenderFunction, forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle } from '@fluentui/react-components'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import { Account } from '@/interfaces/Account'
import UpsertAccountForm from './Form'

type Props = Omit<ComponentProps<typeof UpsertAccountForm>, 'onCancel' | 'onSuccess'>

const GachaLegacyViewUpsertAccountDialog: ForwardRefRenderFunction<{ setOpen (value: boolean): void }, Props> = (
  props,
  ref,
) => {
  const [open, setOpen] = useState(false)
  const notifier = useNotifier()
  const i18n = useI18n()

  useImperativeHandle(ref, () => ({
    setOpen,
  }), [])

  const handleSuccess = useCallback((account: Account) => {
    setOpen(false)
    notifier.success(i18n.t(!props.edit
      ? 'Pages.Gacha.LegacyView.UpsertAccountDialog.AddSuccess'
      : 'Pages.Gacha.LegacyView.UpsertAccountDialog.EditSuccess', { uid: account.uid }))
  }, [i18n, notifier, props.edit])

  return (
    <Dialog modalType="alert" open={open}>
      <DialogSurface>
        <DialogBody>
          <Locale
            component={DialogTitle}
            mapping={[
              !props.edit
                ? 'Pages.Gacha.LegacyView.UpsertAccountDialog.AddTitle'
                : 'Pages.Gacha.LegacyView.UpsertAccountDialog.EditTitle',
              { keyofBusinesses: props.keyofBusinesses },
            ]}
          />
          <DialogContent>
            <UpsertAccountForm
              {...props}
              onCancel={() => setOpen(false)}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export default forwardRef(GachaLegacyViewUpsertAccountDialog)
