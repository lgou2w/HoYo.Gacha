import { ComponentPropsWithoutRef, MouseEventHandler, ReactElement, ReactNode, useCallback, useState } from 'react'
import { Body1, Body2, Button, Caption1, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons'
import { Collapse } from '@fluentui/react-motion-components-preview'
import { UseI18nOptions, useI18n } from '@/i18n'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalM,
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalMNudge,
  },
})

export interface SectionProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  title?: TitleProps
}

export default function Section (props: SectionProps) {
  const { className, title, children, ...rest } = props
  const styles = useStyles()

  return (
    <section className={mergeClasses(styles.root, className)} {...rest}>
      {isTTitleProps(title)
        ? <Body2 as="h6"><TTitle {...title} /></Body2>
        : <Body2 as="h6">{title}</Body2>}
      <div className={styles.items}>
        {children}
      </div>
    </section>
  )
}

type TitleProps = ReactNode | TTitleProps

interface TTitleProps {
  tKey: string
  tNs?: UseI18nOptions['ns']
}

function isTTitleProps (props: TitleProps): props is TTitleProps {
  return typeof props === 'object'
    && props !== null
    && 'tKey' in props
}

function TTitle (props: TTitleProps) {
  const { tKey, tNs } = props
  const { t } = useI18n({ ns: tNs })
  return t(tKey)
}

// Child FC

const useItemStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  rootPaper: {
    boxShadow: tokens.shadow2,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
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
  title: {
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
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
  title: TitleProps
  subtitle?: TitleProps
  transparent?: boolean
}

Section.Item = function SectionItem (props: SectionItemProps) {
  const { className, icon, title, subtitle, transparent, children, ...rest } = props
  const styles = useItemStyles()

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
        <Body1 className={styles.title}>
          {isTTitleProps(title)
            ? <TTitle {...title} />
            : title}
        </Body1>
        {isTTitleProps(subtitle)
          ? <Caption1 className={styles.subtitle}><TTitle {...subtitle} /></Caption1>
          : <Caption1 className={styles.subtitle}>{subtitle}</Caption1>}
      </div>
      <div className={styles.actions}>
        {children}
      </div>
    </div>
  )
}

const useCollapsibleItemStyles = makeStyles({
  root: {},
  collapsed: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
  },
  content: {
    // Item padding + Icon size + Item gap
    padding: `0 calc(${tokens.spacingVerticalM} + ${tokens.fontSizeHero800} + ${tokens.spacingHorizontalM})`,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderTop: 'none',
    borderBottomLeftRadius: tokens.borderRadiusMedium,
    borderBottomRightRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
  },
})

export interface SectionCollapsibleItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'title'> {
  icon: ReactNode
  title: TitleProps
  subtitle?: TitleProps
  transparent?: boolean
  defaultVisible?: boolean
  action?: ReactNode
  children: ReactElement
}

Section.CollapsibleItem = function CollapsibleItem (props: SectionCollapsibleItemProps) {
  const { className, icon, title, subtitle, transparent, defaultVisible, action, children, ...rest } = props
  const styles = useCollapsibleItemStyles()
  const [visible, setVisible] = useState(!!defaultVisible)
  const handleClick = useCallback<MouseEventHandler>(() => {
    setVisible((prev) => !prev)
  }, [])

  return (
    <div className={mergeClasses(styles.root, className)} {...rest}>
      <Section.Item
        className={mergeClasses(visible && styles.collapsed)}
        icon={icon}
        title={title}
        subtitle={subtitle}
        transparent={transparent}
      >
        {action}
        <Button
          appearance="transparent"
          icon={visible ? <ChevronUpRegular /> : <ChevronDownRegular />}
          onClick={handleClick}
        />
      </Section.Item>
      <Collapse visible={visible}>
        <div className={styles.content}>
          {children}
        </div>
      </Collapse>
    </div>
  )
}
