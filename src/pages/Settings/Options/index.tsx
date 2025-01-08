import React from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import SettingsOptionsAbout from './About'
import SettingsOptionsAppearance from './Appearance'
import SettingsOptionsCloud from './Cloud'
import SettingsOptionsGeneral from './General'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalL,
  },
})

type Props = Omit<React.JSX.IntrinsicElements['div'], 'children'>

export default function SettingsOptions (props: Props) {
  const { className, ...rest } = props
  const classes = useStyles()
  return (
    <div className={mergeClasses(classes.root, className)} {...rest}>
      <SettingsOptionsCloud />
      <SettingsOptionsGeneral />
      <SettingsOptionsAppearance />
      <SettingsOptionsAbout />
    </div>
  )
}
