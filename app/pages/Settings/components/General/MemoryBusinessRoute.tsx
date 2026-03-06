import { useCallback } from 'react'
import { Switch, SwitchProps } from '@fluentui/react-components'
import { StackArrowForwardRegular } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'
import { useMemoryRouteSwitchMutation, useMemoryRouteSwitchSuspenseQuery } from '@/pages/Root/queries/business'
import SectionItem from '@/pages/Settings/components/SectionItem'

export default withTrans.SettingsPage(function MemoryBusinessRoute ({ t }: WithTrans) {
  const { data } = useMemoryRouteSwitchSuspenseQuery()
  const mutation = useMemoryRouteSwitchMutation()
  const handleChange = useCallback<Required<SwitchProps>['onChange']>((_, data) => {
    mutation.mutateAsync(data.checked)
  }, [mutation])

  return (
    <SectionItem
      icon={<StackArrowForwardRegular />}
      title={t('General.MemoryBusinessRoute.Title')}
      subtitle={t('General.MemoryBusinessRoute.Subtitle')}
    >
      <Switch
        labelPosition="before"
        label={t('General.MemoryBusinessRoute.State', {
          context: String(data),
        })}
        checked={data}
        onChange={handleChange}
      />
    </SectionItem>
  )
})
