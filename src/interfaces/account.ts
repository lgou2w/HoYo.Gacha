/* eslint-disable no-multi-spaces */

// See: src-tauri/src/storage/entity_account.rs

export enum AccountFacet {
  Genshin = 'genshin',
  StarRail = 'starrail'
}

export interface KnownAccountProperties {
  displayName: string | null
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
