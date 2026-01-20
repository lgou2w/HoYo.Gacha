import { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Body1, Caption1, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
  },
  rootPaper: {
    boxShadow: tokens.shadow2,
    background: tokens.colorNeutralBackgroundAlpha,
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

export interface SectionItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  icon: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  transparent?: boolean
}

export default function SectionItem (props: SectionItemProps) {
  const styles = useStyles()
  const { className, icon, title, subtitle, transparent, children, ...rest } = props

  return (
    <div
      className={mergeClasses(
        styles.root,
        !transparent && styles.rootPaper,
        className,
      )}
      {...rest}
    >
      <div className={styles.icon}>{icon}</div>
      <div className={styles.header}>
        <Body1 className={styles.title}>{title}</Body1>
        {subtitle && <Caption1 className={styles.subtitle}>{subtitle}</Caption1>}
      </div>
      <div className={styles.actions}>{children}</div>
    </div>
  )
}
