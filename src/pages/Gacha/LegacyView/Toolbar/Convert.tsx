import React from 'react'
import { Button, Label, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowDownloadRegular, ArrowUploadRegular } from '@fluentui/react-icons'
import { importGachaRecords } from '@/api/commands/business'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
})

export default function GachaLegacyViewToolbarConvert () {
  const classes = useStyles()

  // FIXME: TEST CODE
  const importData = () => {
    importGachaRecords({
      input: 'your_legacy_uigf_v2_v3_data.json',
      importer: {
        LegacyUigf: {
          expectedUid: 100000000,
          expectedLocale: 'zh-cn',
        },
      },
    })
      .then(console.log)
      .catch(console.error)
  }

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <Label size="small">Import</Label>
        <Button
          icon={<ArrowDownloadRegular />}
          appearance="subtle"
          shape="circular"
          size="large"
          onClick={importData}
        />
      </div>
      <div className={classes.content}>
        <Label size="small">Export</Label>
        <Button
          icon={<ArrowUploadRegular />}
          appearance="subtle"
          shape="circular"
          size="large"
        />
      </div>
    </div>
  )
}
