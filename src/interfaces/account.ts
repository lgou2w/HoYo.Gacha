/* eslint-disable no-multi-spaces */

// See: src-tauri/src/storage/entity_account.rs

export enum AccountFacet {
  Genshin = 'genshin',
  StarRail = 'starrail',
  ZenlessZoneZero = 'zzz'
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
  if (account?.properties?.displayName) {
    return account.properties.displayName
  } else {
    switch (facet) {
      case AccountFacet.Genshin:
        return '旅行者'
      case AccountFacet.StarRail:
        return '开拓者'
      case AccountFacet.ZenlessZoneZero:
        return '绳匠'
      default:
        return 'NULL'
    }
  }
}

// TODO: i18n
export function resolveCurrency (facet: AccountFacet): { currency: string, action: string } {
  switch (facet) {
    case AccountFacet.Genshin:
      return { currency: '原石', action: '祈愿' }
    case AccountFacet.StarRail:
      return { currency: '星琼', action: '跃迁' }
    case AccountFacet.ZenlessZoneZero:
      return { currency: '菲林', action: '调频' }
    default:
      throw new Error(`Unknown account facet: ${facet}`)
  }
}
