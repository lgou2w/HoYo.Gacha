import { createContext } from 'react'
import { GachaUrl } from '@/routes/Gacha/api/business'
import { Dayjs } from '@/utilities/dayjs'

export const DataAction = 'data-action'

export interface GachaUrlContextValue {
  readonly value?: GachaUrl['value'] | null
  readonly creationTime?: GachaUrl['creationTime'] | null
  readonly deadline?: Dayjs | null
  readonly hasExpired: boolean
}

export const GachaUrlContext = createContext<GachaUrlContextValue | null>(null)
GachaUrlContext.displayName = 'GachaUrlContext'
