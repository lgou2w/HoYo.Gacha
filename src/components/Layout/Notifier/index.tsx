import React from 'react'
import { ToasterProps, tokens } from '@fluentui/react-components'
import { NavbarWidth, NotifierId, ScrollbarWidth, TitleBarHeight } from '@/components/Layout/declares'
import Toaster from '@/components/UI/Toaster'

// FIXME: String is working, should it be an inline css property
const ToasterOffsets: ToasterProps['offset'] = {
  'top-start': {
    vertical: `calc(${TitleBarHeight} + ${tokens.spacingVerticalL} - ${tokens.spacingVerticalM})` as unknown as number,
    horizontal: `calc(${NavbarWidth} + ${tokens.spacingHorizontalL})` as unknown as number,
  },
  top: { vertical: `calc(${TitleBarHeight} + ${tokens.spacingVerticalL} - ${tokens.spacingVerticalM})` as unknown as number },
  'top-end': {
    vertical: `calc(${TitleBarHeight} + ${tokens.spacingVerticalL} - ${tokens.spacingVerticalM})` as unknown as number,
    horizontal: `calc(${tokens.spacingHorizontalL} + ${ScrollbarWidth})` as unknown as number,
  },
  'bottom-start': { horizontal: `calc(${NavbarWidth} + ${tokens.spacingHorizontalL})` as unknown as number },
  'bottom-end': { horizontal: `calc(${tokens.spacingHorizontalL} + ${ScrollbarWidth})` as unknown as number },
}

export default function Notifier () {
  return (
    <Toaster
      toasterId={NotifierId}
      offset={ToasterOffsets}
      position="top-end"
    />
  )
}
