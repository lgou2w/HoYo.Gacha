import React from 'react'
import { Button } from '@fluentui/react-components'

interface Props {
  onCancel?: () => void
  onSuccess?: () => void
}

// TODO:
export default function GachaLegacyViewDataConvertExportForm (props: Props) {
  const { onCancel } = props

  return (
    <form>
      <Button onClick={onCancel}>Cancel</Button>
    </form>
  )
}
