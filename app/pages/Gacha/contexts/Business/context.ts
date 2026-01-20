import { createContext } from 'react'
import { AccountBusiness, KeyofAccountBusiness, isValidAccountBusiness } from '@/api/schemas/Account'

export class BusinessState {
  public readonly keyof: KeyofAccountBusiness

  constructor (public readonly value: AccountBusiness) {
    if (!isValidAccountBusiness(value)) {
      throw new Error(`Invalid business: ${value}`)
    }

    this.keyof = AccountBusiness[value] as KeyofAccountBusiness
  }

  /**
   * Check if the current business matches the expected business
   */
  public toBe (expected: AccountBusiness): boolean {
    return this.value === expected
  }

  /**
   * Check if the current business matches any of the expected businesses
   */
  public toMatches (...expected: AccountBusiness[]): boolean {
    return expected.includes(this.value)
  }
}

export const BusinessContext = createContext<BusinessState | null>(null)

BusinessContext.displayName = 'BusinessContext'
