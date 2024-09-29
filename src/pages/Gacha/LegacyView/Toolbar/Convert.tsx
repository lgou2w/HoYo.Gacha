import React from 'react'
import { Button, Field, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowDownloadRegular, ArrowUploadRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalXS
  }
})

export default function GachaLegacyViewToolbarConvert () {
  const classes = useStyles()
  return (
    <Field
      label={{
        size: 'small',
        children: 'Import & Export'
      }}
    >
      <div className={classes.root}>
        <Button
          icon={<ArrowDownloadRegular />}
          appearance="subtle"
          shape="circular"
          size="large"
        />
        <Button
          icon={<ArrowUploadRegular />}
          appearance="subtle"
          shape="circular"
          size="large"
        />
      </div>
    </Field>
  )
}
