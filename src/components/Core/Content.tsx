import React, { PropsWithChildren } from 'react'
import { makeStyles } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  }
})

export default function Content (props: PropsWithChildren) {
  const classes = useStyles()
  return (
    <main className={classes.root}>
      {props.children}
    </main>
  )
}
