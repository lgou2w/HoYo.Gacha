import React, { ComponentProps, ReactElement, useState } from 'react'
import { Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger } from '@fluentui/react-components'
import useAccountBusiness from '@/components/AccountBusiness/useAccountBusiness'
import AddOrEditForm from '@/components/Accounts/BusinessView/AddOrEditForm'
import Locale from '@/components/Core/Locale'

interface Props {
  edit: ComponentProps<typeof AddOrEditForm>['edit']
  trigger: ReactElement
}

export default function AddOrEditDialog (props: Props) {
  const { edit, trigger } = props
  const { keyOfBusinesses } = useAccountBusiness()
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
                ? 'components.accounts.businessView.addOrEditDialog.addTitle'
                : 'components.accounts.businessView.addOrEditDialog.editTitle',
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
