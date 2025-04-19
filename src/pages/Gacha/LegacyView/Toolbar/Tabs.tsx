import React from 'react'
import { Caption1, Tab, TabList, makeStyles, tokens } from '@fluentui/react-components'
import { TabsRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import { Tabs } from '@/pages/Gacha/LegacyView/declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  label: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
  },
})

interface Props {
  value: Tabs
  onChange?: (newValue: Tabs) => void
}

export default function GachaLegacyViewToolbarTabs (props: Props) {
  const styles = useStyles()
  const { value, onChange } = props

  return (
    <div className={styles.root}>
      <div className={styles.label}>
        <TabsRegular />
        <Locale
          component={Caption1}
          mapping={['Pages.Gacha.LegacyView.Toolbar.Tabs.Title']}
        />
      </div>
      <TabList
        selectedValue={value}
        onTabSelect={(_, data) => onChange?.(data.value as Tabs)}
        size="small"
      >
        {Object.values(Tabs).map((tab) => (
          <Locale
            component={Tab}
            key={tab}
            value={tab}
            tabIndex={-1}
            mapping={[`Pages.Gacha.LegacyView.Toolbar.Tabs.${tab}`]}
          />
        ))}
      </TabList>
    </div>
  )
}
