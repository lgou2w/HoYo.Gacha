import React, { ComponentProps, useCallback } from 'react'
import { Dropdown, Option } from '@fluentui/react-components'
import { WindowArrowUpRegular } from '@fluentui/react-icons'
import { useGachaClientareaTabSuspenseQueryData, useUpdateGachaClientareaTabMutation } from '@/api/queries/business'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { Tabs } from '@/pages/Gacha/LegacyView/declares'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'

export default function SettingsOptionsGeneralGachaClientareaTab () {
  return (
    <SettingsOptionsItem
      icon={<WindowArrowUpRegular />}
      title={<Locale mapping={['Pages.Settings.Options.General.GachaClientareaTab.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.General.GachaClientareaTab.Subtitle']} />}
      action={<GachaClientareaTab />}
    />
  )
}

function GachaClientareaTab () {
  const i18n = useI18n()
  const tab = useGachaClientareaTabSuspenseQueryData()
  const updateGachaClientareaTabMutation = useUpdateGachaClientareaTabMutation()
  const handleTabSelect = useCallback<Required<ComponentProps<typeof Dropdown>>['onOptionSelect']>((_, data) => {
    const newValue = data.optionValue as Tabs | undefined
    if (newValue) {
      updateGachaClientareaTabMutation.mutateAsync(newValue)
    }
  }, [updateGachaClientareaTabMutation])

  return (
    <Dropdown
      defaultSelectedOptions={[tab]}
      onOptionSelect={handleTabSelect}
      disabled={updateGachaClientareaTabMutation.isPending}
      value={i18n.t([`Pages.Gacha.LegacyView.Toolbar.Tabs.${tab}`])}
      style={{ minWidth: '10rem' }}
    >
      {Object.keys(Tabs).map((tab) => (
        <Option key={tab} value={tab}>
          {i18n.t([`Pages.Gacha.LegacyView.Toolbar.Tabs.${tab}`])}
        </Option>
      ))}
    </Dropdown>
  )
}
