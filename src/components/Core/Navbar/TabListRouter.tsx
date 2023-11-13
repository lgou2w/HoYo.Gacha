import React, { ReactNode, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Tab, TabList, SelectTabEventHandler, makeStyles, shorthands, tokens, Tooltip } from '@fluentui/react-components'
import { BoardRegular, BoardFilled, PersonCircleRegular, PersonCircleFilled, SettingsRegular, SettingsFilled } from '@fluentui/react-icons'
import { SparkleRegular, SparkleFilled, TrainRegular } from '@/components/Utilities/Icons'

export const ButtonSize = '2.25rem'
const useStyles = makeStyles({
  root: {
    height: '100%'
  },
  tab: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    ':hover': { backgroundColor: tokens.colorNeutralBackground2Hover },
    '[aria-selected=true]': { backgroundColor: tokens.colorBrandBackground2Hover },
    '[aria-selected=true]:hover': { backgroundColor: tokens.colorBrandBackground2Hover }
  },
  icon: {
    width: ButtonSize,
    height: ButtonSize,
    fontSize: ButtonSize
  },
  spacing: {
    flexGrow: 1
  }
})

type Nav = { path: string, icon: { normal: ReactNode, selected?: ReactNode } } | { spacing: true }

const Navs: Nav[] = [
  {
    path: '/',
    icon: {
      normal: <BoardRegular />,
      selected: <BoardFilled />
    }
  },
  {
    path: '/gacha/genshin',
    icon: {
      normal: <SparkleRegular />,
      selected: <SparkleFilled />
    }
  },
  {
    path: '/gacha/starrail',
    icon: {
      normal: <TrainRegular />
    }
  },
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

export default function NavbarTabListRouter () {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const onTabSelect = useCallback<SelectTabEventHandler>((_, data) => {
    if (typeof data.value === 'string') {
      navigate(data.value)
    }
  }, [navigate])

  const classes = useStyles()
  return (
    <TabList
      className={classes.root}
      selectedValue={location.pathname}
      onTabSelect={onTabSelect}
      size="large"
      vertical
    >
      {Navs.map((item, index) => {
        if ('path' in item && 'icon' in item) {
          return (
            <Tooltip
              key={index}
              content={t(`router.${item.path}`)}
              relationship="label"
              positioning="after"
              withArrow
            >
              <Tab
                value={item.path}
                className={classes.tab}
                icon={{
                  className: classes.icon,
                  children: location.pathname === item.path
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
