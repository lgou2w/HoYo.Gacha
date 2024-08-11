import React from 'react'
import { makeStyles } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
  }
})

export default function GachaPageView () {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      PageView
    </div>
  )
}
