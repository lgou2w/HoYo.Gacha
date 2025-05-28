import { useSelectedAccountSuspenseQueryData } from '@/api/queries/accounts'
import { usePrettizedGachaRecordsSuspenseQueryData } from '@/api/queries/business'
import useBusinessContext from '@/hooks/useBusinessContext'
import { Account } from '@/interfaces/Account'
import { Business, KeyofBusinesses } from '@/interfaces/Business'
import { PrettizedGachaRecords } from '@/interfaces/GachaRecord'

export interface CompositeState {
  business: Business
  keyofBusinesses: KeyofBusinesses
  selectedAccount: Account
  prettized: PrettizedGachaRecords
}

export default function useCompositeState (customLocale?: string): CompositeState | null {
  const { business, keyofBusinesses } = useBusinessContext()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const prettized = usePrettizedGachaRecordsSuspenseQueryData(business, selectedAccount?.uid, customLocale)

  if (!selectedAccount || !prettized) {
    return null
  }

  return {
    business,
    keyofBusinesses,
    selectedAccount,
    prettized,
  }
}
