import React from 'react'
import GachaActionUrl from '@/components/gacha/toolbar/GachaActionUrl'
import GachaActionFetch from '@/components/gacha/toolbar/GachaActionFetch'
import GachaActionTabs, { GachaActionTabsProps } from '@/components/gacha/toolbar/GachaActionTabs'
import Stack from '@mui/material/Stack'

export interface GachaToolbarProps {
  ActionTabsProps: GachaActionTabsProps
}

export default function GachaToolbar (props: GachaToolbarProps) {
  const { ActionTabsProps } = props
  return (
    <Stack direction="row" gap={2}>
      <GachaActionUrl />
      <GachaActionFetch />
      <Stack direction="row" gap={3} marginLeft="auto">
        <GachaActionTabs {...ActionTabsProps} />
      </Stack>
    </Stack>
  )
}
