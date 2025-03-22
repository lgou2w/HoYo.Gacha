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
    rowGap: tokens.spacingVerticalL,
  },
  options: {
    flex: 1,
  },
  hero: {
    flex: 0.3,
    flexShrink: 0,
  },
})

export default function SettingsPageView () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <SettingsOptions className={styles.options} />
      <SettingsHero className={styles.hero} />
    </div>
  )
}
