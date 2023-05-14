/* eslint-disable no-multi-spaces */

// See: src-tauri/src/storage/entity_account.rs

export enum AccountFacet {
  Genshin = 'genshin',
  StarRail = 'starrail'
}

export interface KnownAccountProperties {
  displayName?: string | null
  lastGachaUpdated?: string | null
  [key: string]: unknown
}

// #[serde(rename_all = "camelCase")]
export interface Account {
  id: number
  facet: AccountFacet,
  uid: string
  gameDataDir: string
  gachaUrl: string | null
  properties: KnownAccountProperties | null
}

export function resolveAccountDisplayName (facet: AccountFacet, account: Account | null): string {
  if (account && account.facet !== facet) {
    // HACK: strict check
    throw new Error(`Account facet mismatch: ${account.facet} (Expected: ${facet})`)
  }

  // TODO: Default display name i18n
  return account?.properties?.displayName || (
    facet === AccountFacet.Genshin
      ? '旅行者'
      : facet === AccountFacet.StarRail
        ? '开拓者'
        : 'NULL'
  )
}

// TODO: i18n
export function resolveCurrency (facet: AccountFacet): { currency: string, action: string } {
  switch (facet) {
    case AccountFacet.Genshin:
      return { currency: '原石', action: '祈愿' }
    case AccountFacet.StarRail:
      return { currency: '星琼', action: '跃迁' }
    default:
      throw new Error(`Unknown account facet: ${facet}`)
  }
}
