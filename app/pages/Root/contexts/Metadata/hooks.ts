import { use } from 'react'
import { MetadataContext } from './context'

export function useMetadata () {
  const state = use(MetadataContext)
  if (!state) {
    throw new Error('useMetadata must be used within a MetadataProvider')
  } else {
    return state
  }
}
