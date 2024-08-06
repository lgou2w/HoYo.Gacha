import React, { ReactNode } from 'react'
import { Body1Strong, Caption1, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: tokens.shadow2,
    columnGap: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM)
  },
  icon: {
    display: 'flex',
    fontSize: tokens.fontSizeHero800,
    color: tokens.colorBrandForeground2
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1
  },
  action: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS
  }
})

type Props = Omit<React.JSX.IntrinsicElements['div'], 'title' | 'children'> & {
  icon: ReactNode
  title: ReactNode
  subtitle: ReactNode
  action: ReactNode
}

export default function SettingsOptionsItem (props: Props) {
  const { className, icon, title, subtitle, action, ...rest } = props
  const classes = useStyles()
  return (
    <div className={mergeClasses(classes.root, className)} {...rest}>
      <div className={classes.icon}>{icon}</div>
      <div className={classes.header}>
        <Body1Strong>{title}</Body1Strong>
        <Caption1>{subtitle}</Caption1>
      </div>
      <div className={classes.action}>{action}</div>
    </div>
  )
}
