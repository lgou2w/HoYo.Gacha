import React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import SettingsHero from './Hero'
import SettingsOptions from './Options'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL
  },
  options: {
    flex: 1
  },
  hero: {
    flex: 0.3,
    flexShrink: 0
  }
})

export default function SettingsPageView () {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <SettingsOptions className={classes.options} />
      <SettingsHero className={classes.hero} />
    </div>
  )
}
