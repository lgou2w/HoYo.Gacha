import React from 'react'
import { useToastController } from '@fluentui/react-components'
import { LocaleOptions } from '@/components/Core/Locale/declares'

type ToastController = ReturnType<typeof useToastController>

export type DispatchToastOptions = Parameters<ToastController['dispatchToast']>['1']

export interface ToasterContextState extends ToastController {
  toasterId: string

  notify (title: string, options?: DispatchToastOptions): void
  notify (
    title: string,
    body?: string,
    options?: DispatchToastOptions
  ): void

  notifyLocale (title: LocaleOptions, options?: DispatchToastOptions): void
  notifyLocale (
    title: LocaleOptions,
    body?: LocaleOptions,
    options?: DispatchToastOptions
  ): void
}

export const ToasterContext =
  React.createContext<ToasterContextState | null>(null)

ToasterContext.displayName = 'ToasterContext'
