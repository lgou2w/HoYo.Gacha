import React, { Fragment } from 'react'
import { Menu, MenuButtonProps, MenuItem, MenuList, MenuPopover, MenuTrigger, SplitButton } from '@fluentui/react-components'
import { ArrowClockwiseRegular } from '@fluentui/react-icons'
import Locale from '@/components/UI/Locale'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'

// TODO: Check Application Version Updates

export default function SettingsOptionsAboutUpdater () {
  return (
    <SettingsOptionsItem
      icon={<ArrowClockwiseRegular />}
      title={<Locale mapping={['Pages.Settings.Options.About.Updater.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.About.Updater.Subtitle']} />}
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
                  mapping={['Pages.Settings.Options.About.Updater.CheckBtn']}
                />
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <Locale
                  component={MenuItem}
                  mapping={['Pages.Settings.Options.About.Updater.Channel.Stable']}
                />
                <Locale
                  component={MenuItem}
                  mapping={['Pages.Settings.Options.About.Updater.Channel.Insider']}
                />
              </MenuList>
            </MenuPopover>
          </Menu>
        </Fragment>
      )}
    />
  )
}
