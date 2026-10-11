import { createContext } from 'react'
import { AccountBusiness, KeyofAccountBusiness, isAccountBusiness } from '@/api/Account'

export class BusinessContextValue {
  public readonly value: AccountBusiness
  public readonly keyof: KeyofAccountBusiness

  constructor (value: AccountBusiness) {
    if (!isAccountBusiness(value)) {
      throw new Error(`Invalid account business: ${value}`)
    }

    this.value = value
    this.keyof = AccountBusiness[value] as KeyofAccountBusiness
  }

  /** Check if the current business matches the expected business */
  public toBe (expected: AccountBusiness): boolean {
    return this.value === expected
  }

  /** Check if the current business matches any of the expected businesses */
  public toMatches (...expected: AccountBusiness[]): boolean {
    return expected.includes(this.value)
  }
}

export const BusinessContext = createContext<BusinessContextValue | null>(null)
BusinessContext.displayName = 'BusinessContext'
