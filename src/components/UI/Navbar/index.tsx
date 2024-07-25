import React from 'react'
import { makeStyles, shorthands, tokens } from '@fluentui/react-components'
import NavbarTabList from './TabList'

export const Width = '4rem'
const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: Width,
    maxWidth: Width,
    ...shorthands.borderRight(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke3)
  }
})

export default function Navbar () {
  const classes = useStyles()
  return (
    <aside className={classes.root}>
      <NavbarTabList />
    </aside>
  )
}
