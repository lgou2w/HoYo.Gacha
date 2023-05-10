/* eslint-disable no-multi-spaces */

// See: src-tauri/src/gacha/impl_genshin.rs
export interface GenshinGachaRecord {
  id: string
  uid: string
  gacha_type: string // 100 | 200 | 201 | 301
  itemId: string     // always empty
  count: string      // always 1
  time: string
  name: string
  lang: string       // zh-cn
  item_type: string  // 角色 | 武器
  rank_type: string  // 3 | 4 | 5
}

// See: src-tauri/src/gacha/impl_starrail.rs
export interface StarRailGachaRecord {
  id: string
  uid: string
  gacha_id: string
  gacha_type: string // 1 | 2 | 11 | 12
  itemId: string
  count: string      // always 1
  time: string
  name: string
  lang: string       // zh-cn
  item_type: string  // 角色 | 光锥
  rank_type: string  // 3 | 4 | 5
}
