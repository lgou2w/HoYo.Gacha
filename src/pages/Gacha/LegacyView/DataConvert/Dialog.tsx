import React, { ForwardRefRenderFunction, forwardRef, useImperativeHandle, useState } from 'react'
import { Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle } from '@fluentui/react-components'
import Locale from '@/components/Locale'
import useBusinessContext from '@/hooks/useBusinessContext'
import DataConvertExportForm from './ExportForm'
import DataConvertImportForm from './ImportForm'

type Props = {
  preset: 'Import' | 'Export'
}

const GachaLegacyViewDataConvertDialog: ForwardRefRenderFunction<{ setOpen (value: boolean): void }, Props> = (
  props,
  ref,
) => {
  const { preset } = props
  const { keyofBusinesses } = useBusinessContext()

  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    setOpen,
  }), [])

  const close = () => setOpen(false)
  const dialogProps = {
    onCancel: close,
    onSuccess: close,
  }

  return (
    <Dialog modalType="alert" open={open}>
      <DialogSurface>
        <DialogBody>
          <Locale
            component={DialogTitle}
            mapping={[
              `Pages.Gacha.LegacyView.DataConvert.Dialog.${preset}Title`,
              { keyofBusinesses },
            ]}
          />
          <DialogContent>
            {preset === 'Import'
              ? <DataConvertImportForm {...dialogProps} />
              : <DataConvertExportForm {...dialogProps} />
            }
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export default forwardRef(GachaLegacyViewDataConvertDialog)
