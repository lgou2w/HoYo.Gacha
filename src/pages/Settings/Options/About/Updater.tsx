import React from 'react'
import { MenuTrigger } from '@fluentui/react-components'
import { ArrowClockwiseRegular, SparkleRegular, WarningRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import Menu from '@/components/UI/Menu'
import MenuItem from '@/components/UI/MenuItem'
import MenuList from '@/components/UI/MenuList'
import MenuPopover from '@/components/UI/MenuPopover'
import SplitButton from '@/components/UI/SplitButton'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'

// TODO: Check Application Version Updates

export default function SettingsOptionsAboutUpdater () {
  return (
    <SettingsOptionsItem
      icon={<ArrowClockwiseRegular />}
      title={<Locale mapping={['Pages.Settings.Options.About.Updater.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.About.Updater.Subtitle']} />}
      action={(
        <Menu positioning="below-end">
          <MenuTrigger disableButtonEnhancement>
            {(triggerProps) => (
              <Locale
                component={SplitButton}
                menuButton={triggerProps}
                appearance="primary"
                mapping={['Pages.Settings.Options.About.Updater.CheckBtn']}
              />
            )}
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <Locale
                component={MenuItem}
                icon={<SparkleRegular />}
                mapping={['Pages.Settings.Options.About.Updater.Channel.Stable']}
                />
              <Locale
                component={MenuItem}
                icon={<WarningRegular />}
                mapping={['Pages.Settings.Options.About.Updater.Channel.Insider']}
              />
            </MenuList>
          </MenuPopover>
        </Menu>
      )}
    />
  )
}
