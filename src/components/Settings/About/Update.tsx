import React, { Fragment } from 'react'
import { Menu, MenuButtonProps, MenuItem, MenuList, MenuPopover, MenuTrigger, SplitButton } from '@fluentui/react-components'
import { ArrowClockwiseRegular } from '@fluentui/react-icons'
import Locale from '@/components/Core/Locale'
import SettingsGroupItem from '@/components/Settings/GroupItem'

// TODO: Check Application Version Updates

export default function SettingsGroupItemUpdate () {
  return (
    <SettingsGroupItem
      icon={<ArrowClockwiseRegular />}
      title={<Locale mapping={['components.settings.about.update.title']} />}
      subtitle={<Locale mapping={['components.settings.about.update.subtitle']} />}
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
                  mapping={['components.settings.about.update.checkBtn']}
                />
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <Locale
                  component={MenuItem}
                  mapping={['components.settings.about.update.channel.stable']}
                />
                <Locale
                  component={MenuItem}
                  mapping={['components.settings.about.update.channel.insider']}
                />
              </MenuList>
            </MenuPopover>
          </Menu>
        </Fragment>
      )}
    />
  )
}
