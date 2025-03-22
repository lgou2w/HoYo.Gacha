import React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { useImmer } from 'use-immer'
import GachaLegacyViewClientarea from './Clientarea'
import GachaLegacyViewToolbar from './Toolbar'
import { Tabs } from './declares'

// HACK:
//  This is a UI legacy for the v0 version.
//  It is intended for quick version migration.

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
  },
  toolbar: {},
  clientarea: {},
})

export default function GachaLegacyView () {
  const styles = useStyles()
  const [{ tab }, produceState] = useImmer({
    tab: Tabs.Overview,
  })

  return (
    <div className={styles.root}>
      <GachaLegacyViewToolbar
        className={styles.toolbar}
        tab={tab}
        onTabChange={(newValue) => produceState((draft) => {
          draft.tab = newValue
        })}
      />
      <GachaLegacyViewClientarea
        className={styles.clientarea}
        tab={tab}
      />
    </div>
  )
}
