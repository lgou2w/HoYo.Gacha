import React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { NavbarWidth } from '@/components/Layout/declares'
import NavbarNavs from './Navs'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: NavbarWidth,
    minWidth: NavbarWidth,
    maxWidth: NavbarWidth,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
  },
})

export default function Navbar () {
  const styles = useStyles()
  return (
    <aside className={styles.root}>
      <NavbarNavs />
    </aside>
  )
}
