import React, { Fragment } from 'react'
import { Menu, MenuButtonProps, MenuItem, MenuList, MenuPopover, MenuTrigger, SplitButton } from '@fluentui/react-components'
import Locale from '@/components/Core/Locale'
import SettingsGroupItem from '@/components/Routes/Settings/GroupItem'
import { ArrowClockwiseRegular } from '@/components/Utilities/Icons'

// TODO: Check Application Version Updates

export default function SettingsGroupItemUpdate () {
  return (
    <SettingsGroupItem
      icon={<ArrowClockwiseRegular />}
      title={<Locale mapping={['components.routes.settings.about.update.title']} />}
      subtitle={<Locale mapping={['components.routes.settings.about.update.subtitle']} />}
      action={(
        <Fragment>
          <Menu positioning="below-end">
            <MenuTrigger disableButtonEnhancement>
              {(triggerProps: MenuButtonProps) => (
                <Locale
                  component={SplitButton}
                  appearance="primary"
                  size="small"
                  menuButton={triggerProps}
                  mapping={['components.routes.settings.about.update.checkBtn']}
                />
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <Locale
                  component={MenuItem}
                  mapping={['components.routes.settings.about.update.channel.stable']}
                />
                <Locale
                  component={MenuItem}
                  mapping={['components.routes.settings.about.update.channel.insider']}
                />
              </MenuList>
            </MenuPopover>
          </Menu>
        </Fragment>
      )}
    />
  )
}
