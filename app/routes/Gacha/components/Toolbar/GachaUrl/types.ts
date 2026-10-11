import { createContext } from 'react'
import { Dayjs } from '@/utilities/dayjs'

export const DataAction = 'data-action'

export interface GachaUrlContextValue {
  readonly value?: string | null
  readonly deadline?: Dayjs | null
  readonly hasExpired: boolean
}

export const GachaUrlContext = createContext<GachaUrlContextValue | null>(null)
GachaUrlContext.displayName = 'GachaUrlContext'
