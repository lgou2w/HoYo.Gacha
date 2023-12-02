import React, { ReactElement, useState } from 'react'
import { Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger } from '@fluentui/react-components'
import Locale from '@/components/Core/Locale'
import useAccountsFacetView from '@/components/Routes/Accounts/FacetView/useAccountsFacetView'
import CreateAccountDialogForm from './Form'

interface Props {
  trigger: ReactElement
}

export default function CreateAccountDialog (props: Props) {
  const { keyOfFacets } = useAccountsFacetView()
  const [open, setOpen] = useState(false)
  return (
    <Dialog
      modalType="alert"
      open={open}
      onOpenChange={(_, data) => setOpen(data.open)}
    >
      <DialogTrigger action="open" disableButtonEnhancement>
        {props.trigger}
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <Locale
            component={DialogTitle}
            mapping={[
              'components.routes.accounts.facetView.createAccountDialog.title',
              { facet: keyOfFacets }
            ]}
          />
          <DialogContent>
            <CreateAccountDialogForm
              onCancel={() => setOpen(false)}
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
