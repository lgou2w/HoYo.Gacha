/* eslint-disable object-shorthand */
/* eslint-disable quote-props */

import { AccountFacet } from '@/interfaces/account'

export const Character = 'character'
export const Weapon = 'weapon'
export const Bangboo = 'bangboo'

export type Category = typeof Character | typeof Weapon | typeof Bangboo

export const ItemTypeCategoryMappings: Record<AccountFacet, Record<string, Record<string, Category>>> = {
  [AccountFacet.Genshin]: {
    'de-de': { 'Figur': Character, 'Waffe': Weapon },
    'en-us': { 'Character': Character, 'Weapon': Weapon },
    'es-es': { 'Personaje': Character, 'Arma': Weapon },
    'fr-fr': { 'Personnages': Character, 'Arme': Weapon },
    'id-id': { 'Karakter': Character, 'Senjata': Weapon },
    'it-it': { 'Personaggio': Character, 'Armi': Weapon },
    'ja-jp': { 'キャラクター': Character, '武器': Weapon },
    'ko-kr': { '캐릭터': Character, '무기': Weapon },
    'pt-pt': { 'Personagem': Character, 'Arma': Weapon },
    'ru-ru': { 'Персонаж': Character, 'Оружие': Weapon },
    'th-th': { 'ตัวละคร': Character, 'อาวุธ': Weapon },
    'tr-tr': { 'Karakter': Character, 'Silahlar': Weapon },
    'vi-vn': { 'Nhân vật': Character, 'Vũ Khí': Weapon },
    'zh-cn': { '角色': Character, '武器': Weapon },
    'zh-tw': { '角色': Character, '武器': Weapon }
  },
  [AccountFacet.StarRail]: {
    'de-de': { 'Figuren': Character, 'Lichtkegel': Weapon },
    'en-us': { 'Character': Character, 'Light Cone': Weapon },
    'es-es': { 'Personajes': Character, 'Conos de luz': Weapon },
    'fr-fr': { 'Personnages': Character, 'Cônes de lumière': Weapon },
    'id-id': { 'Karakter': Character, 'Light Cone': Weapon },
    'ja-jp': { 'キャラクター': Character, '光円錐': Weapon },
    'ko-kr': { '캐릭터': Character, '광추': Weapon },
    'pt-pt': { 'Personagens': Character, 'Cones de Luz': Weapon },
    'ru-ru': { 'Персонажи': Character, 'Световые конусы': Weapon },
    'th-th': { 'ตัวละคร': Character, 'Light Cone': Weapon },
    'vi-vn': { 'Nhân Vật': Character, 'Nón Ánh Sáng': Weapon },
    'zh-cn': { '角色': Character, '光锥': Weapon },
    'zh-tw': { '角色': Character, '光錐': Weapon }
  },
  [AccountFacet.ZenlessZoneZero]: {
    'de-de': { 'Agenten': Character, 'W-Motoren': Weapon, 'Bangboos': Bangboo },
    'en-us': { 'Agents': Character, 'W-Engines': Weapon, 'Bangboo': Bangboo },
    'es-es': { 'Agentes': Character, 'Amplificadores': Weapon, 'Bangbús': Bangboo },
    'fr-fr': { 'Agents': Character, 'Moteurs-amplis': Weapon, 'Bangbous': Bangboo },
    'id-id': { 'Agen': Character, 'W-Engine': Weapon, 'Bangboo': Bangboo },
    'ja-jp': { 'エージェント': Character, '音動機': Weapon, 'ボンプ': Bangboo },
    'ko-kr': { '에이전트': Character, 'W-엔진': Weapon, '「Bangboo」': Bangboo },
    'pt-pt': { 'Agentes': Character, 'Motores-W': Weapon, 'Bangboos': Bangboo },
    'ru-ru': { 'Агенты': Character, 'Амплификаторы': Weapon, 'Банбу': Bangboo },
    'th-th': { 'Agent': Character, 'W-Engine': Weapon, 'Bangboo': Bangboo },
    'vi-vn': { 'Người Đại Diện': Character, 'W-Engine': Weapon, 'Bangboo': Bangboo },
    'zh-cn': { '代理人': Character, '音擎': Weapon, '邦布': Bangboo },
    'zh-tw': { '代理人': Character, '音擎': Weapon, '邦布': Bangboo }
  }
}
