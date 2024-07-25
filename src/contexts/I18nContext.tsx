import React from 'react'
import { i18n } from 'i18next'

export interface I18nState {
  i18n: i18n
  t: i18n['t']
}

const I18nContext = React.createContext<I18nState | null>(null)

I18nContext.displayName = 'I18nContext'

export default I18nContext
