import { ComponentPropsWithoutRef, ReactElement, ReactNode, useState } from 'react'
import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons'
import { Collapse } from '@fluentui/react-motion-components-preview'
import SectionItem from './SectionItem'

const useStyles = makeStyles({
  collapsed: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
  },
  content: {
    boxShadow: tokens.shadow2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderTop: 'none',
    borderBottomLeftRadius: tokens.borderRadiusMedium,
    borderBottomRightRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackgroundAlpha,
    // Item padding + Icon size + Item gap
    padding: `0 calc(${tokens.spacingVerticalM} + ${tokens.fontSizeHero800} + ${tokens.spacingHorizontalM})`,
  },
})

export interface SectionCollapseItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'title'> {
  icon: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  transparent?: boolean
  defaultVisible?: boolean
  action?: ReactNode
  children: ReactElement
}

export default function SectionCollapseItem (props: SectionCollapseItemProps) {
  const styles = useStyles()
  const { className, icon, title, subtitle, transparent, children, defaultVisible, action, ...rest } = props
  const [visible, setVisible] = useState(!!defaultVisible)

  return (
    <div className={className} {...rest}>
      <SectionItem
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
          onClick={() => setVisible(!visible)}
        />
      </SectionItem>
      <Collapse visible={visible}>
        <div className={styles.content}>
          {children}
        </div>
      </Collapse>
    </div>
  )
}
