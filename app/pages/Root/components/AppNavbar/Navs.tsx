import React, { ComponentProps, ReactNode, createRef, useCallback, useEffect } from 'react'
import { Divider, Image, SelectTabEventHandler, Tab, TabList, imageClassNames, makeStyles, tabClassNames, tokens } from '@fluentui/react-components'
import { SettingsColor } from '@fluentui/react-icons'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { AccountBusinessKeys, KeyofAccountBusiness } from '@/api/schemas/Account'
import BusinessImages from '@/assets/images/BusinessImages'

interface NavIcon { normal: ReactNode, selected?: ReactNode }
interface NavItemPath { path: string, icon: NavIcon | string }
interface NavItemSpacing { spacing: true }
interface NavItemDivider { divider: true }
type NavItem
  = | NavItemPath
    | NavItemSpacing
    | NavItemDivider

const NavItems: NavItem[] = [
  { path: '/', icon: '/Logo.avif' },
  { spacing: true },
  ...AccountBusinessKeys
    .map<NavItemPath>((keyofBusiness) => {
      return {
        path: `/Gacha/${keyofBusiness}`,
        icon: BusinessImages[keyofBusiness as KeyofAccountBusiness].Material!.Icon!,
      }
    }),
  { divider: true },
  {
    path: '/Settings',
    icon: { normal: <SettingsColor /> },
  },
]

const useNavItemStyles = makeStyles({
  path: {
    display: 'inline-flex',
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
      },
    },
    ':enabled:hover': {
      [`& .${tabClassNames.icon}`]: { color: tokens.colorBrandForeground1 },
    },
    ':enabled:active': {
      [`& .${tabClassNames.icon}`]: { color: tokens.colorCompoundBrandForeground1Pressed },
    },
    '[aria-selected=true]': {
      [`& .${tabClassNames.icon} .${imageClassNames.root}`]: {
        border: `${tokens.strokeWidthThick} solid ${tokens.colorBrandStroke2Hover}`,
      },
    },
  },
  spacing: { flex: '1 0 auto' },
  divider: { flex: '0 0 2%' },
})

const MemoizedNavItems = React.memo(function RenderNavItems () {
  const styles = useNavItemStyles()

  return NavItems.map((item, index) => {
    if ('path' in item && 'icon' in item) {
      return (
        <RenderNavItemPath
          key={index}
          tabIndex={-1}
          className={styles.path}
          {...item}
        />
      )
    } else if ('spacing' in item) {
      return <div key={index} className={styles.spacing} />
    } else if ('divider' in item) {
      return <Divider key={index} className={styles.divider} inset />
    } else {
      return null
    }
  })
})

function RenderNavItemPath (props: Omit<ComponentProps<'button'>, 'children'> & NavItemPath) {
  const { path, icon, ...rest } = props
  const location = useLocation()
  const isSelected = location.pathname === path
  const iconChildren = typeof icon === 'string'
    ? <Image src={icon} alt={path} />
    : isSelected
      ? icon.selected || icon.normal
      : icon.normal

  return (
    <Tab
      value={path}
      icon={{ children: iconChildren }}
      {...rest}
    />
  )
}

export default function Navs (props: Omit<ComponentProps<'div'>, 'children'>) {
  const location = useLocation()
  const navigate = useNavigate()
  const handleTabSelect = useCallback<SelectTabEventHandler>((_, data) => {
    if (typeof data.value === 'string') {
      navigate({ to: data.value })
    }
  }, [navigate])

  // HACK: Development only!
  //   This side effect is used to observe the height of
  //   the Tanstack Query Devtools panel and apply it to the TabList.
  //   Avoid bottom routing buttons being covered.
  const tabListRef = createRef<HTMLDivElement>()
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (!tabListRef.current) return

    const container = tabListRef.current
    const devtoolsContainer = document.getElementsByClassName('tsqd-parent-container').item(0)
    if (!devtoolsContainer) return

    function updateMaxHeight (container: HTMLElement, target: HTMLElement | null) {
      let targetHeight = 0
      if (target && (targetHeight = target.clientHeight) > 0) {
        container.style.maxHeight = `calc(100% - ${targetHeight}px)`
      } else {
        container.style.removeProperty('max-height')
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes'
          && mutation.target instanceof HTMLElement
          && mutation.target.classList.contains('tsqd-main-panel')) {
          updateMaxHeight(container, mutation.target)
        }
      }
    })

    // Find child element when onmount and updates them once
    updateMaxHeight(container, devtoolsContainer.querySelector('.tsqd-main-panel'))

    observer.observe(devtoolsContainer, {
      attributes: true,
      subtree: true,
      childList: true,
    })

    return () => {
      updateMaxHeight(container, null)
      observer.disconnect()
    }
  }, [tabListRef])
  //

  return (
    <TabList
      ref={tabListRef}
      selectedValue={location.pathname}
      onTabSelect={handleTabSelect}
      size="large"
      vertical
      {...props}
    >
      <MemoizedNavItems />
    </TabList>
  )
}
