import { Ref } from 'react'
import { Slot, Tab, imageClassNames, makeStyles, mergeClasses, tabClassNames, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flex: '0 0 auto',
    justifyContent: 'center',
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingVerticalMNudge,
    [`& .${tabClassNames.icon}`]: {
      width: tokens.fontSizeHero900,
      height: tokens.fontSizeHero900,
      fontSize: tokens.fontSizeHero900,
      color: tokens.colorCompoundBrandForeground1,
      borderRadius: tokens.borderRadiusLarge,
      [`& .${imageClassNames.root}`]: {
        width: 'inherit',
        height: 'inherit',
        borderRadius: 'inherit',
        border: `${tokens.strokeWidthThick} solid ${tokens.colorTransparentBackground}`,
        transition: `border ${tokens.durationSlow}`,
      },
    },
    '[aria-selected=false]:enabled:hover': {
      [`& .${tabClassNames.icon} .${imageClassNames.root}`]: {
        border: `${tokens.strokeWidthThick} solid ${tokens.colorNeutralStroke1Hover}`,
      },
    },
    '[aria-selected=true]': {
      [`& .${tabClassNames.icon} .${imageClassNames.root}`]: {
        border: `${tokens.strokeWidthThick} solid ${tokens.colorBrandStroke2Hover}`,
      },
    },
  },
})

export interface NavProps {
  ref?: Ref<HTMLButtonElement>
  className?: string
  pathname: string
  icon?: Slot<'span'>
}

export default function Nav (props: NavProps) {
  const { className, ref, pathname, icon } = props
  const styles = useStyles()

  return (
    <Tab
      ref={ref}
      className={mergeClasses(styles.root, className)}
      value={pathname}
      icon={icon}
    />
  )
}
