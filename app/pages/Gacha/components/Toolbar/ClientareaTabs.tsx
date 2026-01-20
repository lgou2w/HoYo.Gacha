import { memo, useCallback } from 'react'
import { SelectTabEventHandler, Tab, TabList } from '@fluentui/react-components'
import { TabsRegular } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'
import ToolbarContainer from '@/pages/Gacha/components/Toolbar/Container'
import { Clientarea, Clientareas, useClientarea } from '@/pages/Gacha/contexts/Clientarea'

export default withTrans.GachaPage(function ClientareaTabs ({ t }: WithTrans) {
  return (
    <ToolbarContainer
      icon={TabsRegular}
      label={t('Toolbar.ClientareaTabs.Label')}
    >
      <Tabs />
    </ToolbarContainer>
  )
})

function Tabs () {
  const clientarea = useClientarea()
  const handleTabSelect = useCallback<SelectTabEventHandler>((_, data) => {
    clientarea.change(data.value as Clientarea)
  }, [clientarea])

  return (
    <TabList
      onTabSelect={handleTabSelect}
      selectedValue={clientarea.active}
      appearance="transparent"
      size="small"
    >
      <TabsItems />
    </TabList>
  )
}

const TabsItems = memo(withTrans.GachaPage(function Items ({ t }: WithTrans) {
  return Clientareas.map((value) => (
    <Tab key={value} value={value} tabIndex={-1}>
      {t(`Toolbar.ClientareaTabs.${value}`)}
    </Tab>
  ))
}))
