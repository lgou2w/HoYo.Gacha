import React from 'react'
import { makeStyles } from '@fluentui/react-components'
import GachaLegacyView from './LegacyView'

const useStyles = makeStyles({
  root: {},
})

export default function GachaPageView () {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <GachaLegacyView />
    </div>
  )
}
