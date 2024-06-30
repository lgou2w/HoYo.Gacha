import { useContext } from 'react'
import { GachaRecordsContext } from './Context'

export default function useGachaRecords () {
  const value = useContext(GachaRecordsContext)
  if (!value) {
    throw new Error('useGachaRecords must be used within a GachaRecordsContext.Provider')
  } else {
    return value
  }
}
