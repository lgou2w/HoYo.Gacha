import React, { ComponentProps, ForwardRefRenderFunction, forwardRef, useImperativeHandle, useState } from 'react'
import { Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle } from '@fluentui/react-components'
import Locale from '@/components/UI/Locale'
import UpsertAccountForm from './Form'

type Props = Omit<ComponentProps<typeof UpsertAccountForm>, 'onCancel' | 'onSuccess'>

const GachaLegacyViewUpsertAccountDialog: ForwardRefRenderFunction<
  {
    setOpen (value: boolean): void
  },
  Props
> = (props, ref) => {
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    setOpen,
  }), [])

  return (
    <Dialog
      modalType="alert"
      open={open}
      onOpenChange={(_, data) => setOpen(data.open)}
    >
      <DialogSurface>
        <DialogBody>
          <Locale
            component={DialogTitle}
            mapping={[
              !props.edit
                ? 'Pages.Gacha.LegacyView.UpsertAccountDialog.AddTitle'
                : 'Pages.Gacha.LegacyView.UpsertAccountDialog.EditTitle',
              { business: props.keyofBusinesses },
            ]}
          />
          <DialogContent>
            <UpsertAccountForm
              {...props}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export default forwardRef(GachaLegacyViewUpsertAccountDialog)
