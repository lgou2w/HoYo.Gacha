import { createContext } from 'react'
import { AccountBusiness } from '@/api/Account'
import { GachaStats } from '@/routes/Gacha/api/stats'

export const GachaStatsContext = createContext<GachaStats<AccountBusiness> | null>(null)
GachaStatsContext.displayName = 'GachaStatsContext'
