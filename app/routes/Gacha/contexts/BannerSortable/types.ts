import { AccountBusiness } from '@/api/Account'
import { BannerCategory } from '@/routes/Gacha/api/stats'

const GenshinImpactOrder: BannerCategory[] = [
  BannerCategory.Character,
  BannerCategory.Weapon,
  BannerCategory.ChronicledAndLightrace,
  BannerCategory.Permanent,
  BannerCategory.Beginner,
]

const HonkaiStarRailOrder: BannerCategory[] = [
  BannerCategory.Character,
  BannerCategory.Weapon,
  BannerCategory.CollabCharacter,
  BannerCategory.CollabWeapon,
  BannerCategory.Permanent,
  BannerCategory.Beginner,
]

const ZenlessZoneZeroOrder: BannerCategory[] = [
  BannerCategory.Character,
  BannerCategory.Weapon,
  BannerCategory.Permanent,
  BannerCategory.Bangboo,
  BannerCategory.ExclusiveRescreening,
  BannerCategory.WEngineReverberation,
]

const MiliastraWonderlandOrder: BannerCategory[] = [
  BannerCategory.PermanentOde,
  BannerCategory.EventOde,
]

const BusinessOrders: Record<AccountBusiness, BannerCategory[]> = {
  [AccountBusiness.GenshinImpact]: GenshinImpactOrder,
  [AccountBusiness.HonkaiStarRail]: HonkaiStarRailOrder,
  [AccountBusiness.ZenlessZoneZero]: ZenlessZoneZeroOrder,
  [AccountBusiness.MiliastraWonderland]: MiliastraWonderlandOrder,
}

export function defaultOrderFor (business: AccountBusiness): BannerCategory[] {
  return BusinessOrders[business] ?? []
}

const BusinessHiddens: Record<AccountBusiness, BannerCategory[]> = {
  [AccountBusiness.GenshinImpact]: [BannerCategory.Beginner],
  [AccountBusiness.HonkaiStarRail]: [BannerCategory.Beginner],
  [AccountBusiness.ZenlessZoneZero]: [],
  [AccountBusiness.MiliastraWonderland]: [],
}

export function defaultHiddenFor (business: AccountBusiness): BannerCategory[] {
  return BusinessHiddens[business] ?? []
}

/** Required banners per business. */
const BusinessRequireds: Record<AccountBusiness, Set<BannerCategory>> = {
  [AccountBusiness.GenshinImpact]: new Set([
    BannerCategory.ChronicledAndLightrace,
  ]),
  [AccountBusiness.HonkaiStarRail]: new Set([
    BannerCategory.CollabCharacter,
    BannerCategory.CollabWeapon,
  ]),
  [AccountBusiness.ZenlessZoneZero]: new Set([
    BannerCategory.ExclusiveRescreening,
    BannerCategory.WEngineReverberation,
  ]),
  [AccountBusiness.MiliastraWonderland]: new Set(),
}

export function requiredBannersFor (business: AccountBusiness): Set<BannerCategory> {
  return BusinessRequireds[business] ?? new Set()
}
