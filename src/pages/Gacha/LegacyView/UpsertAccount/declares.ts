import { Account } from '@/interfaces/Account'

export interface UpsertAccountFormData {
  uid: string
  displayName: string | undefined
  dataFolder: Account['dataFolder']
}

export const DisplayNameMaxLength = 16
