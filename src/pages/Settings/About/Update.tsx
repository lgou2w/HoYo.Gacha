import React, { Fragment } from 'react'
import { Menu, MenuButtonProps, MenuItem, MenuList, MenuPopover, MenuTrigger, SplitButton } from '@fluentui/react-components'
import { ArrowClockwiseRegular } from '@fluentui/react-icons'
import Locale from '@/components/Commons/Locale'
import SettingsGroupItem from '@/pages/Settings/GroupItem'

// TODO: Check Application Version Updates

export default function SettingsGroupItemUpdate () {
  return (
    <SettingsGroupItem
      icon={<ArrowClockwiseRegular />}
      title={<Locale mapping={['Pages.Settings.About.Update.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.About.Update.Subtitle']} />}
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
                  mapping={['Pages.Settings.About.Update.CheckBtn']}
                />
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <Locale
                  component={MenuItem}
                  mapping={['Pages.Settings.About.Update.Channel.Stable']}
                />
                <Locale
                  component={MenuItem}
                  mapping={['Pages.Settings.About.Update.Channel.Insider']}
                />
              </MenuList>
            </MenuPopover>
          </Menu>
        </Fragment>
      )}
    />
  )
}
