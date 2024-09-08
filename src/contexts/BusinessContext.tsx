import React from 'react'
import { Business, KeyofBusinesses } from '@/interfaces/Business'

export interface BusinessState {
  readonly business: Business
  readonly keyofBusinesses: KeyofBusinesses
}

const BusinessContext = React.createContext<BusinessState | null>(null)

BusinessContext.displayName = 'BusinessContext'

export default BusinessContext