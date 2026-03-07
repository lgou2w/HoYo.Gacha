import { useCallback } from 'react'
import { Dropdown, DropdownProps, Option } from '@fluentui/react-components'
import { WindowArrowUpRegular } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'
import { Clientarea } from '@/pages/Gacha/contexts/Clientarea'
import { useClientareaInitialMutation, useClientareaInitialSuspenseQuery } from '@/pages/Gacha/queries/clientarea'
import SectionItem from '@/pages/Settings/components/SectionItem'

export default withTrans.SettingsPage(function GachaClientareaTabs ({ t }: WithTrans) {
  const { data } = useClientareaInitialSuspenseQuery()
  const mutation = useClientareaInitialMutation()
  const handleTabSelect = useCallback<Required<DropdownProps>['onOptionSelect']>((_, data) => {
    const newValue = data.optionValue as Clientarea | undefined
    if (newValue) {
      mutation.mutateAsync(newValue)
    }
  }, [mutation])

  return (
    <SectionItem
      icon={<WindowArrowUpRegular />}
      title={t('General.GachaClientareaTabs.Title')}
      subtitle={t('General.GachaClientareaTabs.Subtitle')}
    >
      <Dropdown
        value={t(`General.GachaClientareaTabs.${data}`)}
        defaultSelectedOptions={[data]}
        onOptionSelect={handleTabSelect}
        disabled={mutation.isPending}
        style={{ minWidth: '10rem' }}
      >
        {Object.values(Clientarea).map((option) => (
          <Option key={option} value={option}>
            {t(`General.GachaClientareaTabs.${option}`)}
          </Option>
        ))}
      </Dropdown>
    </SectionItem>
  )
})
