import React from 'react'
import { Caption1, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowDownloadRegular, ArrowUploadRegular } from '@fluentui/react-icons'
import { importGachaRecords } from '@/api/commands/business'
import Locale from '@/components/Locale'
import Button from '@/components/UI/Button'

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
    alignItems: 'center',
  },
})

export default function GachaLegacyViewToolbarConvert () {
  const styles = useStyles()

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
    <div className={styles.root}>
      <div className={styles.content}>
        <Locale
          component={Caption1}
          mapping={['Pages.Gacha.LegacyView.Toolbar.Convert.Import.Title']}
        />
        <Button
          icon={<ArrowDownloadRegular />}
          appearance="subtle"
          shape="circular"
          size="large"
          onClick={importData}
        />
      </div>
      <div className={styles.content}>
        <Locale
          component={Caption1}
          mapping={['Pages.Gacha.LegacyView.Toolbar.Convert.Export.Title']}
        />
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
