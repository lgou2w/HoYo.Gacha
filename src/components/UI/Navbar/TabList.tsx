import React, { ReactNode, createRef, useEffect } from 'react'
import { Image, Tab, TabList, Tooltip, imageClassNames, makeStyles, shorthands, tabClassNames, tokens } from '@fluentui/react-components'
import { BoardFilled, BoardRegular, PersonCircleFilled, PersonCircleRegular, SettingsFilled, SettingsRegular } from '@fluentui/react-icons'
import { useLocation, useNavigate } from '@tanstack/react-router'
import Locale from '@/components/UI/Locale'
import { Businesses, ReversedBusinesses } from '@/interfaces/Account'

export const ButtonSize = tokens.fontSizeHero900
const useStyles = makeStyles({
  root: { height: '100%' },
  tab: {
    borderRadius: tokens.borderRadiusSmall,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    [`& .${tabClassNames.icon}`]: {
      width: ButtonSize,
      height: ButtonSize,
      fontSize: ButtonSize,
      color: tokens.colorCompoundBrandForeground1,
      [`& .${imageClassNames.root}`]: {
        width: 'inherit',
        height: 'inherit',
        borderRadius: tokens.borderRadiusMedium,
        ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke2)
      }
    },
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
      [`& .${tabClassNames.icon}`]: { color: tokens.colorBrandForeground1 }
    },
    ':active': {
      backgroundColor: tokens.colorNeutralBackground2Pressed,
      [`& .${tabClassNames.icon}`]: { color: tokens.colorCompoundBrandForeground1Pressed }
    },
    '[aria-selected=true]': {
      backgroundColor: tokens.colorBrandBackground2Hover,
      [`& .${tabClassNames.icon} .${imageClassNames.root}`]: {
        ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorBrandStroke2Pressed)
      }
    },
    '[aria-selected=true]:hover': { backgroundColor: tokens.colorBrandBackground2Hover },
    '[aria-selected=true]:active': { backgroundColor: tokens.colorBrandBackground2Pressed }
  },
  spacing: { flexGrow: 1 }
})

type NavIcon = { normal: ReactNode, selected?: ReactNode }
type NavItem = { path: string, icon: NavIcon | string } | { spacing: true }

const Navs: NavItem[] = [
  {
    path: '/',
    icon: {
      normal: <BoardRegular />,
      selected: <BoardFilled />
    }
  },
  ...Object
    .entries(Businesses)
    .map(([key, business]) => {
      return {
        path: `/gacha/${key}`,
        icon: `/${ReversedBusinesses[business]}/Icon.png`
      } as NavItem
    }),
  { spacing: true },
  {
    path: '/accounts',
    icon: {
      normal: <PersonCircleRegular />,
      selected: <PersonCircleFilled />
    }
  },
  {
    path: '/settings',
    icon: {
      normal: <SettingsRegular />,
      selected: <SettingsFilled />
    }
  }
]

export default function NavbarTabList () {
  const classes = useStyles()
  const location = useLocation()
  const navigate = useNavigate()

  // HACK: Development only!
  //   This side effect is used to observe the height of
  //   the Tanstack Query Devtools panel and apply it to the TabList.
  //   Avoid bottom routing buttons being covered.
  const tabListRef = createRef<HTMLDivElement>()
  useEffect(() => {
    if (!tabListRef.current) return
    if (!import.meta.env.DEV) return

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
      childList: true
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
      className={classes.root}
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
              content={<Locale mapping={[`Components.UI.Navbar.TabList.${item.path}`]} />}
              relationship="label"
              positioning="after"
              withArrow
            >
              <Tab
                value={item.path}
                className={classes.tab}
                icon={{
                  children: typeof item.icon === 'string'
                    ? <Image src={item.icon} />
                    : location.pathname === item.path
                      ? item.icon.selected || item.icon.normal
                      : item.icon.normal
                }}
              />
            </Tooltip>
          )
        } else if ('spacing' in item) {
          return (
            <div key={index} className={classes.spacing} />
          )
        } else {
          return null
        }
      })}
    </TabList>
  )
}