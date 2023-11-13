import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, MenuButtonProps, MenuItem, MenuList, MenuPopover, MenuTrigger, SplitButton } from '@fluentui/react-components'
import SettingsGroupItem from '@/components/Routes/Settings/GroupItem'
import { ArrowClockwiseRegular } from '@/components/Utilities/Icons'

// TODO: Check Application Version Updates

export default function SettingsGroupItemUpdate () {
  const { t } = useTranslation()

  return (
    <SettingsGroupItem
      icon={<ArrowClockwiseRegular />}
      title={t('routes.settings.about.update.title')}
      subtitle={t('routes.settings.about.update.subtitle')}
      action={(
        <Fragment>
          <Menu positioning="below-end">
            <MenuTrigger disableButtonEnhancement>
              {(triggerProps: MenuButtonProps) => (
                <SplitButton appearance="primary" size="small" menuButton={triggerProps}>
                  {t('routes.settings.about.update.checkBtn')}
                </SplitButton>
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem>{t('routes.settings.about.update.channel.stable')}</MenuItem>
                <MenuItem>{t('routes.settings.about.update.channel.insider')}</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </Fragment>
      )}
    />
  )
}
