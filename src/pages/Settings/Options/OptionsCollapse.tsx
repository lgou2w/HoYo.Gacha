import React, { Fragment, ReactElement, ReactNode, useState } from 'react'
import { Button, buttonClassNames, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { ChevronDownRegular, ChevronUpRegular } from '@fluentui/react-icons'
import { Collapse } from '@fluentui/react-motion-components-preview'
import SettingsOptionsItem from './OptionsItem'

const useStyles = makeStyles({
  root: {},
  main: {},
  collapser: {
    [`& .${buttonClassNames.icon}`]: {
      fontSize: tokens.fontSizeBase500,
      width: tokens.fontSizeBase500,
      height: tokens.fontSizeBase500,
    },
  },
  mainCollapsed: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
  },
  collapse: {
    boxShadow: tokens.shadow2,
    borderBottomLeftRadius: tokens.borderRadiusMedium,
    borderBottomRightRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackground1,
    // OptionsItem padding + Icon size + OptionsItem gap
    padding: `0 calc(${tokens.spacingVerticalM} + ${tokens.fontSizeHero800} + ${tokens.spacingHorizontalM})`,
  },
})

interface Props {
  icon: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  children: ReactElement
  initialVisible?: boolean
  actionExt?: ReactNode
}

export default function SettingsOptionsCollapse (props: Props) {
  const { icon, title, subtitle, children, initialVisible, actionExt } = props
  const classes = useStyles()
  const [visible, setVisible] = useState(!!initialVisible)

  return (
    <div className={classes.root}>
      <SettingsOptionsItem
        className={mergeClasses(classes.main, visible && classes.mainCollapsed)}
        icon={icon}
        title={title}
        subtitle={subtitle}
        action={(
          <Fragment>
            {actionExt}
            <Button
              className={classes.collapser}
              appearance="transparent"
              icon={visible ? <ChevronUpRegular /> : <ChevronDownRegular />}
              onClick={() => setVisible(!visible)}
            />
          </Fragment>
        )}
      />
      <Collapse visible={visible}>
        <div className={classes.collapse}>
          {children}
        </div>
      </Collapse>
    </div>
  )
}
