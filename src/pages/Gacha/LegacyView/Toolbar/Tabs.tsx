import React from 'react'
import { Field, SelectTabEventHandler, Tab, TabList, makeStyles, tokens } from '@fluentui/react-components'
import { Tabs } from '@/pages/Gacha/LegacyView/declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalXS
  }
})

interface Props {
  value: Tabs
  onChange?: SelectTabEventHandler
}

export default function GachaLegacyViewToolbarTabs (props: Props) {
  const { value, onChange } = props
  const classes = useStyles()
  return (
    <Field
      label={{
        size: 'small',
        children: 'Tabs'
      }}
    >
      <TabList
        className={classes.root}
        selectedValue={value}
        onTabSelect={onChange}
        size="small"
      >
        {Object.values(Tabs).map((tab) => (
          <Tab key={tab} value={tab}>
            {tab}
          </Tab>
        ))}
      </TabList>
    </Field>
  )
}
