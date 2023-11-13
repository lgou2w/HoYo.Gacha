import React, { ReactNode } from 'react'
import { Body1Strong, Caption1, makeStyles, shorthands, tokens } from '@fluentui/react-components'

const IconSize = '2.25rem'
const useStyle = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: tokens.shadow4,
    columnGap: tokens.spacingVerticalM,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM)
  },
  icon: {
    display: 'inline-flex',
    fontSize: IconSize,
    width: IconSize,
    height: IconSize,
    color: tokens.colorBrandForeground2
  },
  header: {
    display: 'inline-flex',
    flexDirection: 'column',
    flexGrow: 1
  },
  action: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS
  }
})

interface Props {
  icon: ReactNode
  title: ReactNode
  subtitle: ReactNode
  action: ReactNode
}

export default function SettingsGroupItem (props: Props) {
  const classes = useStyle()
  return (
    <section className={classes.root}>
      <div className={classes.icon}>
        {props.icon}
      </div>
      <div className={classes.header}>
        <Body1Strong>{props.title}</Body1Strong>
        <Caption1>{props.subtitle}</Caption1>
      </div>
      <div className={classes.action}>
        {props.action}
      </div>
    </section>
  )
}
