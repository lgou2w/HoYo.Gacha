import React, { ReactNode } from 'react'
import { Body1Strong, Caption1, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
  },
  rootPaper: {
    boxShadow: tokens.shadow2,
    background: tokens.colorNeutralBackground1,
  },
  icon: {
    display: 'flex',
    fontSize: tokens.fontSizeHero800,
    color: tokens.colorBrandForeground2,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
  },
})

interface Props {
  className?: string
  icon: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  action: ReactNode
  transparent?: boolean
}

export default function SettingsOptionsItem (props: Props) {
  const { className, icon, title, subtitle, action, transparent } = props
  const classes = useStyles()
  const rootClasses = mergeClasses(
    classes.root,
    !transparent && classes.rootPaper,
    className,
  )

  return (
    <div className={rootClasses}>
      <div className={classes.icon}>{icon}</div>
      <div className={classes.header}>
        <Body1Strong>{title}</Body1Strong>
        {subtitle && <Caption1>{subtitle}</Caption1>}
      </div>
      <div className={classes.actions}>{action}</div>
    </div>
  )
}
