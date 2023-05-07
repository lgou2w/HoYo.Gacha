/* eslint-disable no-multi-spaces */

// See: src-tauri/src/gacha/impl_genshin.rs
// #[serde(rename_all = "camelCase")]
export interface GenshinGachaRecord {
  id: string
  uid: string
  gachaType: string // 100 | 200 | 201 | 301
  itemId: string    // always empty
  count: string     // always 1
  time: string
  name: string
  lang: string      // zh-cn
  itemType: string  // 角色 | 武器
  rankType: string  // 3 | 4 | 5
}

// See: src-tauri/src/gacha/impl_starrail.rs
// #[serde(rename_all = "camelCase")]
export interface StarRailGachaRecord {
  id: string
  uid: string
  gachaId: string
  gachaType: string // 1 | 2 | 11 | 12
  itemId: string
  count: string     // always 1
  time: string
  name: string
  lang: string      // zh-cn
  itemType: string  // 角色 | 光锥
  rankType: string  // 3 | 4 | 5
}
