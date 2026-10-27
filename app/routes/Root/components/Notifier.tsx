import { Toaster, ToasterProps, tokens } from '@fluentui/react-components'
import useNotifier from '@/routes/Root/hooks/useNotifier'
import { NavbarWidth, TitleBarHeight } from './types'

export interface NotifierProps {
  toasterId: string
  position?: ToasterProps['position']
}

export default function Notifier (props: NotifierProps) {
  const { toasterId, position } = props
  useNotifier(props.toasterId)

  return (
    <Toaster
      toasterId={toasterId}
      position={position}
      offset={Offsets}
    />
  )
}

// FIXME: String is working, should it be an inline css property
const Offsets: ToasterProps['offset'] = {
  'top-start': {
    vertical: TitleBarHeight as unknown as number,
    horizontal: `calc(${NavbarWidth} + ${tokens.spacingHorizontalL})` as unknown as number,
  },
  top: {
    vertical: TitleBarHeight as unknown as number,
  },
  'top-end': {
    vertical: TitleBarHeight as unknown as number,
    horizontal: `calc(${tokens.spacingHorizontalL} + 16px)` as unknown as number,
  },
  'bottom-start': {
    vertical: tokens.spacingHorizontalL as unknown as number,
    horizontal: `calc(${NavbarWidth} + ${tokens.spacingHorizontalL})` as unknown as number,
  },
  bottom: {
    vertical: tokens.spacingHorizontalL as unknown as number,
  },
  'bottom-end': {
    vertical: tokens.spacingHorizontalL as unknown as number,
    horizontal: `calc(${tokens.spacingHorizontalL} + 16px)` as unknown as number,
  },
}
