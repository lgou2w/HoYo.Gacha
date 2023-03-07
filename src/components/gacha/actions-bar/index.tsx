import React from 'react'
import Stack from '@mui/material/Stack'
import GachaActionUrl, { GachaActionUrlProps } from './action-url'
import GachaActionFetch, { GachaActionFetchProps } from './action-fetch'
import GachaActionTabs, { GachaActionTabsProps } from './action-tabs'
import GachaActionExt, { GachaActionExtProps } from './action-ext'

export interface GachaActionsBarProps {
  urlProps: GachaActionUrlProps
  fetchProps: GachaActionFetchProps
  tabsProps: GachaActionTabsProps
  extProps: GachaActionExtProps
}

export default function GachaActionsBar (props: GachaActionsBarProps) {
  const { urlProps, fetchProps, tabsProps, extProps } = props
  return (
    <Stack flexDirection="row" gap={2}>
      <GachaActionUrl {...urlProps} />
      <GachaActionFetch {...fetchProps} />
      <Stack flexDirection="row" gap={3} marginLeft="auto">
        <GachaActionTabs {...tabsProps} />
        <GachaActionExt {...extProps} />
      </Stack>
    </Stack>
  )
}
