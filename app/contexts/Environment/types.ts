import { createContext } from 'react'
import { Environment } from '@/api/App'

export type EnvironmentContextValue = Environment

export const EnvironmentContext = createContext<EnvironmentContextValue | null>(null)
EnvironmentContext.displayName = 'EnvironmentContext'
