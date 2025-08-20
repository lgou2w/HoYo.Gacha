import React, { useState } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { useGachaClientareaTabSuspenseQueryData } from '@/api/queries/business'
import GachaLegacyViewClientarea from './Clientarea'
import GachaLegacyViewToolbar from './Toolbar'

// HACK:
//  This is a UI legacy for the v0 version.
//  It is intended for quick version migration.

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    height: '100%',
  },
  toolbar: {},
  clientarea: {},
})

export default function GachaLegacyView () {
  const styles = useStyles()
  const gachaClientareaTab = useGachaClientareaTabSuspenseQueryData()
  const [tab, setTab] = useState(gachaClientareaTab)

  return (
    <div className={styles.root}>
      <GachaLegacyViewToolbar
        className={styles.toolbar}
        onTabChange={(newValue) => setTab(newValue)}
        tab={tab}
      />
      <GachaLegacyViewClientarea
        className={styles.clientarea}
        tab={tab}
      />
    </div>
  )
}
