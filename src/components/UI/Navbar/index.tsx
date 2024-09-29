import React from 'react'
import { makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { NavbarWidth } from '@/components/UI/consts'
import NavbarTabList from './TabList'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: NavbarWidth,
    minWidth: NavbarWidth,
    maxWidth: NavbarWidth,
    ...shorthands.borderRight(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1)
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
