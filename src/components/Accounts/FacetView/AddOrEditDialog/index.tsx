import React, { ComponentProps, ReactElement, useState } from 'react'
import { Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger } from '@fluentui/react-components'
import AddOrEditForm from '@/components/Accounts/FacetView/AddOrEditForm'
import useAccountsFacetView from '@/components/Accounts/FacetView/useAccountsFacetView'
import Locale from '@/components/Core/Locale'

interface Props {
  edit: ComponentProps<typeof AddOrEditForm>['edit']
  trigger: ReactElement
}

export default function AddOrEditDialog (props: Props) {
  const { edit, trigger } = props
  const { keyOfFacets } = useAccountsFacetView()
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
                ? 'components.accounts.facetView.addOrEditDialog.addTitle'
                : 'components.accounts.facetView.addOrEditDialog.editTitle',
              { facet: keyOfFacets }
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
