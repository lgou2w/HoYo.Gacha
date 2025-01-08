import React from 'react'
import { Label, Tab, TabList, makeStyles, tokens } from '@fluentui/react-components'
import { Tabs } from '@/pages/Gacha/LegacyView/declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
})

interface Props {
  value: Tabs
  onChange?: (newValue: Tabs) => void
}

export default function GachaLegacyViewToolbarTabs (props: Props) {
  const { value, onChange } = props
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Label size="small">Tabs</Label>
      <TabList
        selectedValue={value}
        onTabSelect={(_, data) => onChange?.(data.value as Tabs)}
        size="small"
      >
        {Object.values(Tabs).map((tab) => (
          <Tab key={tab} value={tab}>
            {tab}
          </Tab>
        ))}
      </TabList>
    </div>
  )
}
