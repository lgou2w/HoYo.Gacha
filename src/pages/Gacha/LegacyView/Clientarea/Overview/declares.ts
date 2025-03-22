import { Account } from '@/interfaces/Account'
import { Business, KeyofBusinesses } from '@/interfaces/Business'
import { PrettizedGachaRecords } from '@/interfaces/GachaRecord'

export interface ParentCompositeState {
  business: Business
  keyofBusinesses: KeyofBusinesses
  selectedAccount: Account
  prettized: PrettizedGachaRecords
}
