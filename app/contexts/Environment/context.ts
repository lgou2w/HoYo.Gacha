import { createContext } from 'react'
import { Environment } from '@/api/commands/app'

export const EnvironmentContext = createContext<Environment | null>(null)

EnvironmentContext.displayName = 'EnvironmentContext'
