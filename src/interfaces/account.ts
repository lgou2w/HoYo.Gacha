/* eslint-disable no-multi-spaces */

// See: src-tauri/src/storage/entity_account.rs

export enum AccountFacet {
  Genshin = 'genshin',
  StarRail = 'starrail'
}

// #[serde(rename_all = "camelCase")]
export interface Account {
  id: number
  facet: AccountFacet,
  uid: string
  gameDataDir: string
  gachaUrl: string | null
  properties: Record<string, unknown> | null
}
