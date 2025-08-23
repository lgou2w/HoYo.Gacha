import React, { ReactNode } from 'react'
import { Body1, Caption1, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

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
  title: {},
  subtitle: {
    opacity: 0.8,
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
  const styles = useStyles()
  const { className, icon, title, subtitle, action, transparent } = props
  const rootClasses = mergeClasses(
    styles.root,
    !transparent && styles.rootPaper,
    className,
  )

  return (
    <div className={rootClasses}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.header}>
        <Body1 className={styles.title}>{title}</Body1>
        {subtitle && <Caption1 className={styles.subtitle}>{subtitle}</Caption1>}
      </div>
      <div className={styles.actions}>{action}</div>
    </div>
  )
}
