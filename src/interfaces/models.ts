/** See: src-tauri/src/genshin/gacha_url.rs */
export interface GachaUrl {
  addr: number
  creationTime: string
  url: string
}

/** See: src-tauri/src/genshin/path_finder.rs */
export interface GameDirectory {
  outputLog: string
  gameDataDir: string
  international: boolean
}

/** See: src-tauri/src/gacha/official/model.rs */
export interface GachaLogItem {
  uid: string
  gachaType: '100' | '200' | '301' | '302' | '400'
  itemId: string
  count: string
  time: string
  name: string
  lang: string
  itemType: string
  rankType: string
  id: string
}

/** See: src-tauri/src/third_party/enka_network.rs */
export interface EnkaNetworkPlayerInfo {
  nickname: string,
  level: number
  signature?: string
  worldLevel?: number
  nameCardId: number
  finishAchievementNum: number
  towerFloorIndex?: number
  towerLevelIndex?: number
  showAvatarInfoList?: Array<{ avatarId: number, level: number }>
  showNameCardInfoList?: number[]
  profilePicture: { avatarId: number }
}
