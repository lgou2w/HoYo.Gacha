import React from 'react'
import { AccountFacet } from '@/interfaces/account'
import GachaActionUrl from '@/components/gacha/toolbar/GachaActionUrl'
import GachaActionFetch from '@/components/gacha/toolbar/GachaActionFetch'
import GachaActionImport from '@/components/gacha/toolbar/GachaActionImport'
import GachaActionExport from '@/components/gacha/toolbar/GachaActionExport'
import GachaActionTabs, { GachaActionTabsProps } from '@/components/gacha/toolbar/GachaActionTabs'
import Stack from '@mui/material/Stack'

export interface GachaToolbarProps {
  facet: AccountFacet
  ActionTabsProps: GachaActionTabsProps
}

export default function GachaToolbar (props: GachaToolbarProps) {
  const { facet, ActionTabsProps } = props
  return (
    <Stack direction="row" gap={2}>
      <GachaActionUrl />
      <GachaActionFetch />
      <Stack direction="row" gap={3} marginLeft="auto">
        <GachaActionTabs {...ActionTabsProps} />
        {facet !== AccountFacet.ZenlessZoneZero && (
          <Stack direction="row" gap={1}>
            <GachaActionImport />
            <GachaActionExport />
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
