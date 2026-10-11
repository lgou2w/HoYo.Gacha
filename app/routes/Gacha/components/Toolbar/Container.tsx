import { ComponentPropsWithoutRef, ComponentType, ReactNode } from 'react'
import { Body1, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { UseI18nOptions, useI18n } from '@/i18n'
import { ToolbarHeight } from '@/routes/Gacha/components/types'

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
  label?: LabelProps
  labelCenter?: boolean
}

export default function ToolbarContainer (props: ToolbarContainerProps) {
  const { className, children, icon: Icon, label, labelCenter, ...rest } = props
  const styles = useStyles()

  return (
    <div className={mergeClasses(styles.root, className)} {...rest}>
      <div className={mergeClasses(styles.label, labelCenter && styles.labelCenter)}>
        {Icon && <Icon className={styles.labelIcon} />}
        {isTLabelProps(label)
          ? <TLabel {...label} />
          : label}
      </div>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}

type LabelProps = ReactNode | TLabelProps

interface TLabelProps {
  tKey: string
  tNs?: UseI18nOptions['ns']
}

function isTLabelProps (props: LabelProps): props is TLabelProps {
  return typeof props === 'object'
    && props !== null
    && 'tKey' in props
}

function TLabel (props: TLabelProps) {
  const { tKey, tNs } = props
  const { t } = useI18n({ ns: tNs })
  return (
    <Body1>
      {t(tKey)}
    </Body1>
  )
}
