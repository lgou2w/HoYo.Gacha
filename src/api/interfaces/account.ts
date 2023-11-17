// Account
//   See: src-tauri/src/database/entity_account.rs

// Declares

export const AccountFacets = {
  Genshin: 0,
  StarRail: 1
} as const

export type AccountFacet = typeof AccountFacets[keyof typeof AccountFacets]

export interface Account {
  id: number
  facet: AccountFacet
  uid: number
  gameDataDir: string
  gachaUrl: string | null
  gachaUrlUpdatedAt: string | null
  properties: Record<string, unknown> | null
  createdAt: string
}

// Utilities

export function isGenshinAccount (account: Account): boolean {
  return account.facet === AccountFacets.Genshin
}

export function isStarRailAccount (account: Account): boolean {
  return account.facet === AccountFacets.StarRail
}
