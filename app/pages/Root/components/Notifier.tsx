import { useEffect } from 'react'
import { Toaster, ToasterProps, tokens } from '@fluentui/react-components'
import { useRouter } from '@tanstack/react-router'
import useNotifier from '@/hooks/useNotifier'
import { NavbarWidth, ScrollbarWidth, TitleBarHeight } from './consts'

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
  const notifier = useNotifier()
  const router = useRouter()

  // HACK: Dismiss all toasts when the path changes
  useEffect(() => {
    return router.subscribe('onBeforeNavigate', (event) => {
      if (event.pathChanged) {
        notifier.dismissAll()
      }
    })
  }, [notifier, router])

  return (
    <Toaster
      toasterId={notifier.NotifierId}
      offset={ToasterOffsets}
      position="top-end"
    />
  )
}
