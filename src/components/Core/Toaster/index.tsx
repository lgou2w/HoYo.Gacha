import React, { ComponentProps, PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster as FuiToaster, Toast, ToastBody, ToastTitle, tokens, useId, useToastController } from '@fluentui/react-components'
import { Width as NavbarWidth } from '@/components/Core/Navbar'
import { Height as TitleBarHeight } from '@/components/Core/TitleBar'
import { ToasterContext, ToasterContextState, DispatchToastOptions } from './Context'

type ToasterProps = ComponentProps<typeof FuiToaster>

// FIXME: String is working, should it be an inline css property
const ToasterOffset: ToasterProps['offset'] = {
  top: {
    vertical: TitleBarHeight as unknown as number
  },
  'top-end': {
    vertical: TitleBarHeight as unknown as number
  },
  'top-start': {
    vertical: TitleBarHeight as unknown as number,
    horizontal: `calc(${NavbarWidth} + ${tokens.spacingHorizontalM})` as unknown as number
  },
  'bottom-start': {
    horizontal: `calc(${NavbarWidth} + ${tokens.spacingHorizontalM})` as unknown as number
  }
}

const Id = 'toaster'
const DefaultPosition: ToasterProps['position'] = 'top-end'
const DefaultDispatchOptions: DispatchToastOptions = {
  position: DefaultPosition
}

export default function Toaster (props: PropsWithChildren) {
  const toasterId = useId(Id)
  const controller = useToastController(toasterId)

  const notify: ToasterContextState['notify'] = (...[title, bodyOrOptions, options]) => {
    const body = typeof bodyOrOptions === 'string' ? bodyOrOptions : undefined
    const options1 = typeof bodyOrOptions === 'object'
      ? bodyOrOptions
      : options as DispatchToastOptions | undefined

    controller.dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { ...DefaultDispatchOptions, ...options1 }
    )
  }

  const { t } = useTranslation()
  const notifyLocale: ToasterContextState['notifyLocale'] = (...[title, bodyOrOptions, options]) => {
    const title1 = t(title[0], title[1])
    const body1 = Array.isArray(bodyOrOptions)
      ? t(bodyOrOptions[0], bodyOrOptions[1])
      : undefined

    const options1 = !Array.isArray(bodyOrOptions) && typeof bodyOrOptions === 'object'
      ? bodyOrOptions
      : options as DispatchToastOptions | undefined

    notify(title1, body1, options1)
  }

  return (
    <ToasterContext.Provider value={{
      toasterId,
      notify,
      notifyLocale,
      ...controller
    }}>
      <FuiToaster
        toasterId={toasterId}
        offset={ToasterOffset}
        position={DefaultPosition}
        inline
      />
      {props.children}
    </ToasterContext.Provider>
  )
}
