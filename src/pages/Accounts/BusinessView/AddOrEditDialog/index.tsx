import React, { ComponentProps, ReactElement, useState } from 'react'
import { Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger } from '@fluentui/react-components'
import useBusiness from '@/components/BusinessProvider/useBusiness'
import Locale from '@/components/Commons/Locale'
import AddOrEditForm from '@/pages/Accounts/BusinessView/AddOrEditForm'

interface Props {
  edit: ComponentProps<typeof AddOrEditForm>['edit']
  trigger: ReactElement
}

export default function AddOrEditDialog (props: Props) {
  const { edit, trigger } = props
  const { keyOfBusinesses } = useBusiness()
  const [open, setOpen] = useState(false)
  return (
    <Dialog
      modalType="alert"
      open={open}
      onOpenChange={(_, data) => setOpen(data.open)}
    >
      <DialogTrigger action="open" disableButtonEnhancement>
        {trigger}
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <Locale
            component={DialogTitle}
            mapping={[
              !edit
                ? 'Pages.Accounts.BusinessView.AddOrEditDialog.AddTitle'
                : 'Pages.Accounts.BusinessView.AddOrEditDialog.EditTitle',
              { business: keyOfBusinesses }
            ]}
          />
          <DialogContent>
            <AddOrEditForm
              edit={edit}
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
