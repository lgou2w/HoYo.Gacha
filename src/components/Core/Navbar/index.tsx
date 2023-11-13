import React from 'react'
import { makeStyles, shorthands, tokens } from '@fluentui/react-components'
import NavbarTabListRouter from './TabListRouter'

const MaxWidth = '5rem'
const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: MaxWidth,
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke3)
  }
})

export default function Navbar () {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <NavbarTabListRouter />
    </div>
  )
}
