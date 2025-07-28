import React, { ComponentProps, ElementRef, Fragment, MouseEventHandler, PropsWithoutRef, useCallback, useRef } from 'react'
import { Button, Caption1, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowDownloadRegular, ArrowUploadRegular } from '@fluentui/react-icons'
import { useSelectedAccountSuspenseQueryData } from '@/api/queries/accounts'
import Locale from '@/components/Locale'
import useBusinessContext from '@/hooks/useBusinessContext'
import DataConvertDialog from '@/pages/Gacha/LegacyView/DataConvert/Dialog'

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

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <Locale
          component={Caption1}
          mapping={['Pages.Gacha.LegacyView.Toolbar.Convert.Import.Title']}
        />
        <DataConvertPreset preset="Import" />
      </div>
      <div className={styles.content}>
        <Locale
          component={Caption1}
          mapping={['Pages.Gacha.LegacyView.Toolbar.Convert.Export.Title']}
        />
        <DataConvertPreset preset="Export" />
      </div>
    </div>
  )
}

function DataConvertPreset (props: PropsWithoutRef<ComponentProps<typeof DataConvertDialog>>) {
  const { preset } = props
  const { keyofBusinesses } = useBusinessContext()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)

  const dialogRef = useRef<ElementRef<typeof DataConvertDialog>>(null)
  const handleClick = useCallback<MouseEventHandler>(() => {
    dialogRef.current?.setOpen(true)
  }, [])

  return (
    <Fragment>
      <Button
        icon={preset === 'Import' ? <ArrowDownloadRegular /> : <ArrowUploadRegular />}
        appearance="subtle"
        shape="circular"
        size="large"
        onClick={handleClick}
        disabled={!selectedAccount}
      />
      <DataConvertDialog
        ref={dialogRef}
        preset={preset}
      />
    </Fragment>
  )
}
