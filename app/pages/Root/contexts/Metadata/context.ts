import { createContext } from 'react'
import { UseQueryResult } from '@tanstack/react-query'
import { MetadataUpdateResult } from '@/api/commands/metadata'

export type MetadataState = UseQueryResult<MetadataUpdateResult | 'offline' | undefined>

export const MetadataContext = createContext<MetadataState | null>(null)

MetadataContext.displayName = 'MetadataContext'
