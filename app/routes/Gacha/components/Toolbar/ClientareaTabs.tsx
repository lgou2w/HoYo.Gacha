import { startTransition, useCallback } from 'react'
import { SelectTabEventHandler, Tab, TabList } from '@fluentui/react-components'
import { TabsRegular } from '@fluentui/react-icons'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useAccount } from '@/routes/Gacha/contexts/Account/hooks'
import { useClientarea } from '@/routes/Gacha/contexts/Clientarea/hooks'
import { Clientareas, isClientarea } from '@/routes/Gacha/contexts/Clientarea/types'
import ToolbarContainer from './Container'

export default function ClientareaTabs () {
  return (
    <ToolbarContainer
      icon={TabsRegular}
      label={{
        tKey: 'Toolbar.ClientareaTabs.Label',
        tNs: KnownI18nNs.GachaPage,
      }}
    >
      <ClientareaTabsInner />
    </ToolbarContainer>
  )
}

function ClientareaTabsInner () {
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const { selected } = useAccount()
  const { active, change } = useClientarea()
  const handleSelect = useCallback<SelectTabEventHandler>((_, data) => {
    const newVal = data.value
    if (!isClientarea(newVal)) {
      console.warn('Unexpected clientarea tab value:', newVal)
      return
    }

    startTransition(async () => {
      await change(newVal)
    })
  }, [change])

  return (
    <TabList
      selectedValue={active}
      onTabSelect={handleSelect}
      disabled={!selected}
      appearance="transparent"
      size="small"
    >
      {Clientareas.map((value) => (
        <Tab key={value} value={value} tabIndex={-1}>
          {t(`Toolbar.ClientareaTabs.${value}`)}
        </Tab>
      ))}
    </TabList>
  )
}
