import React from 'react'
import { Business, Businesses } from '@/api/interfaces/account'

export interface BusinessContextState {
  keyOfBusinesses: keyof typeof Businesses
  business: Business
}

export const BusinessContext =
  React.createContext<BusinessContextState | null>(null)

BusinessContext.displayName = 'BusinessContext'
