import React, { ReactNode, createRef, useEffect } from 'react'
import { Divider, Image, Tab, TabList, Tooltip, imageClassNames, makeStyles, tabClassNames, tokens } from '@fluentui/react-components'
import { SettingsFilled, SettingsRegular } from '@fluentui/react-icons'
import { useLocation, useNavigate } from '@tanstack/react-router'
import BizImages from '@/components/BizImages'
import Locale from '@/components/Locale'
import { Businesses, KeyofBusinesses } from '@/interfaces/Business'
import Routes, { mergeRouteParams } from '@/routes'

const useStyles = makeStyles({
  root: { height: '100%' },
  tab: {
    display: 'flex',
    justifyContent: 'center',
    borderRadius: tokens.borderRadiusSmall,
    padding: `${tokens.spacingVerticalMNudge} ${tokens.spacingHorizontalMNudge}`,
    [`& .${tabClassNames.icon}`]: {
      width: tokens.fontSizeHero900,
      height: tokens.fontSizeHero900,
      fontSize: tokens.fontSizeHero900,
      color: tokens.colorCompoundBrandForeground1,
      borderRadius: tokens.borderRadiusLarge,
      [`& .${imageClassNames.root}`]: {
        width: '100%',
        height: '100%',
        borderRadius: tokens.borderRadiusLarge,
        border: `${tokens.strokeWidthThick} solid transparent`,
      },
    },
    ':enabled:hover': { [`& .${tabClassNames.icon}`]: { color: tokens.colorBrandForeground1 } },
    ':enabled:active': { [`& .${tabClassNames.icon}`]: { color: tokens.colorCompoundBrandForeground1Pressed } },
    [`[aria-selected=true] .${tabClassNames.icon} .${imageClassNames.root}`]: {
      border: `${tokens.strokeWidthThick} solid ${tokens.colorBrandStroke2Hover}`,
    },
  },
  spacing: { flexGrow: 1 },
  divider: { flexGrow: 0.025 },
})

type NavIcon = { normal: ReactNode, selected?: ReactNode }
type NavItem =
  | { path: string, icon: NavIcon | string }
  | { spacing: true }
  | { divider: true }

const Navs: NavItem[] = [
  { path: Routes.Home, icon: '/Logo.webp' },
  { spacing: true },
  ...Object
    .entries(Businesses)
    .map(([keyofBusinesses]) => {
      return {
        path: mergeRouteParams(Routes.Gacha, { keyofBusinesses }),
        icon: BizImages[keyofBusinesses as KeyofBusinesses].Material!.Icon,
      } as NavItem
    }),
  { divider: true },
  {
    path: Routes.Settings,
    icon: {
      normal: <SettingsRegular />,
      selected: <SettingsFilled />,
    },
  },
]

export default function NavbarNavs () {
  const styles = useStyles()
  const location = useLocation()
  const navigate = useNavigate()

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
        if (mutation.type === 'attributes' &&
          mutation.target instanceof HTMLElement &&
          mutation.target.classList.contains('tsqd-main-panel')) {
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
      className={styles.root}
      selectedValue={location.pathname}
      onTabSelect={(_, data) => {
        if (typeof data.value === 'string') {
          navigate({ to: data.value })
        }
      }}
      size="large"
      vertical
    >
      {Navs.map((item, index) => {
        if ('path' in item && 'icon' in item) {
          return (
            <Tooltip
              key={index}
              content={<Locale mapping={[`Routes.${item.path}`]} />}
              relationship="label"
              positioning="after"
              withArrow
            >
              <Tab
                value={item.path}
                className={styles.tab}
                tabIndex={-1}
                icon={{
                  children: typeof item.icon === 'string'
                    ? <Image src={item.icon} />
                    : location.pathname === item.path
                      ? item.icon.selected || item.icon.normal
                      : item.icon.normal,
                }}
              />
            </Tooltip>
          )
        } else if ('divider' in item) {
          return <Divider key={index} className={styles.divider} inset />
        } else if ('spacing' in item) {
          return <div key={index} className={styles.spacing} />
        } else {
          return null
        }
      })}
    </TabList>
  )
}
