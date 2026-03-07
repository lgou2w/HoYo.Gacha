import { ComponentPropsWithoutRef, ComponentType, ReactNode } from 'react'
import { Body1, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { ToolbarHeight } from '@/pages/Gacha/components/consts'

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
    justifyContent: 'space-between',
    height: ToolbarHeight,
    minHeight: ToolbarHeight,
    maxHeight: ToolbarHeight,
  },
  label: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    height: tokens.fontSizeBase400,
  },
  labelCenter: {
    justifyContent: 'center',
  },
  labelIcon: {
    flexShrink: 0,
    fontSize: tokens.fontSizeBase400,
  },
  content: {
    display: 'inline-flex',
    flexDirection: 'row',
    flex: '1 0 auto',
    columnGap: tokens.spacingHorizontalS,
    // Toolbar - Label - Spacing * 2
    height: `calc(${ToolbarHeight} - ${tokens.fontSizeBase400} - ${tokens.spacingVerticalXS} * 2)`,
    maxHeight: `calc(${ToolbarHeight} - ${tokens.fontSizeBase400} - ${tokens.spacingVerticalXS} * 2)`,
  },
})

export interface ToolbarContainerProps extends ComponentPropsWithoutRef<'div'> {
  icon?: ComponentType<{ className?: string }>
  label: ReactNode
  labelCenter?: boolean
}

export default function ToolbarContainer (props: ToolbarContainerProps) {
  const { className, children, icon: Icon, label, labelCenter, ...rest } = props
  const styles = useStyles()

  return (
    <div className={mergeClasses(styles.root, className)} {...rest}>
      <div className={mergeClasses(styles.label, labelCenter && styles.labelCenter)}>
        {Icon && <Icon className={styles.labelIcon} />}
        <Body1>{label}</Body1>
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
