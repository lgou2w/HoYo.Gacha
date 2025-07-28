import React from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import SettingsOptionsAbout from './About'
import SettingsOptionsAppearance from './Appearance'
import SettingsOptionsGeneral from './General'
import SettingsOptionsMigration from './Migration'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalL,
  },
})

type Props = Omit<React.JSX.IntrinsicElements['div'], 'children'>

export default function SettingsOptions (props: Props) {
  const styles = useStyles()
  const { className, ...rest } = props

  return (
    <div className={mergeClasses(styles.root, className)} {...rest}>
      <SettingsOptionsMigration />
      <SettingsOptionsGeneral />
      <SettingsOptionsAppearance />
      <SettingsOptionsAbout />
    </div>
  )
}
