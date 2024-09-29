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
    rowGap: tokens.spacingVerticalL
  },
  toolbar: {},
  clientarea: {}
})

export default function GachaLegacyView () {
  const classes = useStyles()
  const [{ tab }, produceState] = useImmer({
    tab: Tabs.Overview
  })

  return (
    <div className={classes.root}>
      <GachaLegacyViewToolbar
        className={classes.toolbar}
        tab={tab}
        onTabChange={(_, data) => produceState((draft) => {
          draft.tab = data.value as Tabs
        })}
      />
      <GachaLegacyViewClientarea
        className={classes.clientarea}
        tab={tab}
      />
    </div>
  )
}
