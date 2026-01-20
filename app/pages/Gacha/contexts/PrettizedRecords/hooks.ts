import { use } from 'react'
import { PrettizedRecordsContext } from './context'

export function usePrettizedRecords () {
  const state = use(PrettizedRecordsContext)
  if (!state) {
    throw new Error('usePrettizedRecords must be used within a PrettizedRecordsProvider')
  } else {
    return state
  }
}
