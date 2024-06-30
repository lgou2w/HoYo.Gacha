import React from 'react'
import { Business, KeyofBusinesses } from '@/api/interfaces/account'

export interface BusinessContextState {
  keyofBusinesses: KeyofBusinesses
  business: Business
}

export const BusinessContext =
  React.createContext<BusinessContextState | null>(null)

BusinessContext.displayName = 'BusinessContext'
