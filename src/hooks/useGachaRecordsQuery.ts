/* eslint-disable no-use-before-define */

import React from 'react'
import { QueryKey, FetchQueryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { AccountFacet, Account, resolveCurrency } from '@/interfaces/account'
import { GenshinGachaRecord, StarRailGachaRecord, ZenlessZoneZeroGachaRecord } from '@/interfaces/gacha'
import PluginStorage from '@/utilities/plugin-storage'

type GachaRecord = GenshinGachaRecord | StarRailGachaRecord | ZenlessZoneZeroGachaRecord

// Computed Gacha Records
// See below
export interface GachaRecords {
  readonly facet: AccountFacet
  readonly uid: Account['uid']
  readonly gachaTypeToCategoryMappings: Record<GachaRecord['gacha_type'], NamedGachaRecords['category']>
  readonly values: Partial<Record<GachaRecord['gacha_type'], GachaRecord[]>>
  readonly namedValues: Omit<Record<NamedGachaRecords['category'], NamedGachaRecords>, 'anthology' | 'bangboo'>
    & { 'anthology'?: NamedGachaRecords } // Genshin Impact only
    & { 'bangboo'?: NamedGachaRecords } // Zenless Zone Zero only
  readonly aggregatedValues: Omit<NamedGachaRecords, 'category' | 'categoryTitle' | 'gachaType' | 'lastEndId'>
  readonly total: number
  readonly firstTime?: GachaRecord['time']
  readonly lastTime?: GachaRecord['time']
}

export interface NamedGachaRecords {
  category: 'newbie' | 'permanent' | 'character' | 'weapon' | 'anthology' | 'bangboo'
  categoryTitle: string
  gachaType: GachaRecord['gacha_type']
  lastEndId?: GachaRecord['id']
  values: GachaRecord[]
  total: number
  firstTime?: GachaRecord['time']
  lastTime?: GachaRecord['time']
  metadata: {
    blue: GachaRecordsMetadata
    purple: GachaRecordsMetadata
    golden: GoldenGachaRecordsMetadata
  }
}

export interface GachaRecordsMetadata {
  values: GachaRecord[]
  sum: number
  sumPercentage: number
}

export interface GoldenGachaRecordsMetadata extends GachaRecordsMetadata {
  values: Array<GachaRecord & { usedPity: number, restricted?: true }>
  sumAverage: number
  sumRestricted: number
  nextPity: number
}

/// Query

const QueryPrefix = 'gachaRecords'

const gachaRecordsQueryFn: FetchQueryOptions<GachaRecords | null>['queryFn'] = async (context) => {
  const [, facet, uid] = context.queryKey as [string, AccountFacet, Account['uid'] | null]
  if (!uid) {
    return null
  }

  const rawGachaRecords: GachaRecord[] = await PluginStorage.findGachaRecords(facet, { uid })
  return computeGachaRecords(facet, uid, rawGachaRecords)
}

function createQuery (
  facet: AccountFacet,
  uid: Account['uid'] | null
): FetchQueryOptions<GachaRecords | null> & { queryKey: QueryKey } {
  return {
    queryKey: [QueryPrefix, facet, uid],
    queryFn: gachaRecordsQueryFn,
    staleTime: Infinity
    // gcTime: Infinity // TODO: GachaRecords infinity gc time?
  }
}

export function useGachaRecordsQuery (facet: AccountFacet, uid: Account['uid'] | null) {
  const query = createQuery(facet, uid)
  return useQuery({
    ...query,
    refetchOnWindowFocus: false
  })
}

/// Hook

export function useRefetchGachaRecordsFn () {
  const queryClient = useQueryClient()
  return React.useCallback(async (facet: AccountFacet, uid: Account['uid']) => {
    const query = createQuery(facet, uid)
    await queryClient.refetchQueries({
      queryKey: query.queryKey,
      exact: true
    })
  }, [queryClient])
}

/// Private Compute Fn

function computeGachaRecords (
  facet: AccountFacet,
  uid: Account['uid'],
  data: GachaRecord[]
): GachaRecords {
  const total = data.length
  const firstTime = data[0]?.time
  const lastTime = data[total - 1]?.time
  const values = data.reduce((acc, record) => {
    const ref = acc[record.gacha_type]
    if (!ref) {
      acc[record.gacha_type] = [record]
    } else {
      ref.push(record)
    }
    return acc
  }, {} as GachaRecords['values'])

  const namedValues = computeNamedGachaRecords(facet, values)
  const aggregatedValues = computeAggregatedGachaRecords(facet, data, namedValues)
  const gachaTypeToCategoryMappings = Object
    .values(namedValues)
    .reduce((acc, prev) => {
      acc[prev.gachaType] = prev.category
      return acc
    }, {} as GachaRecords['gachaTypeToCategoryMappings'])

  return {
    facet,
    uid,
    total,
    gachaTypeToCategoryMappings,
    values,
    namedValues,
    aggregatedValues,
    firstTime,
    lastTime
  }
}

const KnownGenshinGachaTypes: Record<GenshinGachaRecord['gacha_type'], NamedGachaRecords['category']> = {
  100: 'newbie',
  200: 'permanent',
  301: 'character', // include 400
  302: 'weapon',
  500: 'anthology'
}

const KnownStarRailGachaTypes: Record<StarRailGachaRecord['gacha_type'], NamedGachaRecords['category']> = {
  2: 'newbie',
  1: 'permanent',
  11: 'character',
  12: 'weapon'
}

const KnownZenlessZoneZeroGachaTypes: Record<ZenlessZoneZeroGachaRecord['gacha_type'], NamedGachaRecords['category']> = {
  0: 'newbie', // Avoid undefined metadata
  1: 'permanent',
  2: 'character',
  3: 'weapon',
  5: 'bangboo'
}

const KnownCategoryTitles: Record<AccountFacet, Record<NamedGachaRecords['category'], string>> = {
  [AccountFacet.Genshin]: {
    bangboo: '', // Useless
    anthology: '集录',
    character: '角色活动',
    weapon: '武器活动',
    permanent: '常驻',
    newbie: '新手'
  },
  [AccountFacet.StarRail]: {
    bangboo: '', // Useless
    anthology: '', // Useless
    character: '角色活动',
    weapon: '光锥活动',
    permanent: '常驻',
    newbie: '新手'
  },
  [AccountFacet.ZenlessZoneZero]: {
    bangboo: '邦布频段',
    anthology: '', // Useless
    character: '独家频段',
    weapon: '音擎频段',
    permanent: '常驻频段',
    newbie: '' // Useless
  }
}

export const isRankTypeOfBlue = (facet: AccountFacet, record: GachaRecord) =>
  record.rank_type === (facet === AccountFacet.ZenlessZoneZero ? '2' : '3')
export const isRankTypeOfPurple = (facet: AccountFacet, record: GachaRecord) =>
  record.rank_type === (facet === AccountFacet.ZenlessZoneZero ? '3' : '4')
export const isRankTypeOfGolden = (facet: AccountFacet, record: GachaRecord) =>
  record.rank_type === (facet === AccountFacet.ZenlessZoneZero ? '4' : '5')

const sortGachaRecordById = (a: GachaRecord, b: GachaRecord) => a.id.localeCompare(b.id)

function concatNamedGachaRecordsValues (
  facet: AccountFacet,
  values: GachaRecords['values'],
  gachaType: GachaRecord['gacha_type'],
  category: NamedGachaRecords['category']
): GachaRecord[] {
  const data = values[gachaType] || []
  if (facet === AccountFacet.Genshin && category === 'character') {
    // HACK: Genshin Impact: 301 and 400 are the character gacha type
    return Array.from(data)
      .concat(values['400'] || [])
      .sort(sortGachaRecordById)
  } else {
    return Array.from(data)
  }
}

function computeNamedGachaRecords (
  facet: AccountFacet,
  values: GachaRecords['values']
): GachaRecords['namedValues'] {
  const { action: currencyAction } = resolveCurrency(facet)

  let categories: Record<GachaRecord['gacha_type'], NamedGachaRecords['category']>
  switch (facet) {
    case AccountFacet.Genshin:
      categories = KnownGenshinGachaTypes
      break
    case AccountFacet.StarRail:
      categories = KnownStarRailGachaTypes
      break
    case AccountFacet.ZenlessZoneZero:
      categories = KnownZenlessZoneZeroGachaTypes
      break
    default:
      throw new Error(`Unsupported account facet: ${facet}`)
  }

  return Object
    .entries(categories)
    .reduce((acc, [gachaType, category]) => {
      const categoryTitle = KnownCategoryTitles[facet][category] + currencyAction
      const data = concatNamedGachaRecordsValues(facet, values, gachaType, category)
      const total = data.length
      const lastEndId = data[total - 1]?.id
      const firstTime = data[0]?.time
      const lastTime = data[total - 1]?.time
      const metadata: NamedGachaRecords['metadata'] = {
        blue: computeGachaRecordsMetadata(total, data.filter((v) => isRankTypeOfBlue(facet, v))),
        purple: computeGachaRecordsMetadata(total, data.filter((v) => isRankTypeOfPurple(facet, v))),
        golden: computeGoldenGachaRecordsMetadata(facet, data)
      }

      acc[category] = {
        category,
        categoryTitle,
        gachaType,
        lastEndId,
        total,
        firstTime,
        lastTime,
        values: data,
        metadata
      }
      return acc
    }, {} as GachaRecords['namedValues'])
}

function computeAggregatedGachaRecords (
  facet: AccountFacet,
  data: GachaRecord[],
  namedValues: GachaRecords['namedValues']
): GachaRecords['aggregatedValues'] {
  // HACK: Bangboo is a completely separate gacha pool and doesn't count towards the aggregated.
  if (facet === AccountFacet.ZenlessZoneZero) {
    data = data.filter((v) => v.gacha_type !== '5')
  }

  const total = data.length
  const firstTime = data[0]?.time
  const lastTime = data[total - 1]?.time
  const { newbie, permanent, character, weapon, anthology } = namedValues

  const blueSum =
    newbie.metadata.blue.sum +
    permanent.metadata.blue.sum +
    character.metadata.blue.sum +
    weapon.metadata.blue.sum +
    (anthology ? anthology.metadata.blue.sum : 0)

  const blueSumPercentage = blueSum > 0 ? Math.round(blueSum / total * 10000) / 100 : 0
  const blueValues = data.filter((v) => isRankTypeOfBlue(facet, v))

  const purpleSum =
    newbie.metadata.purple.sum +
    permanent.metadata.purple.sum +
    character.metadata.purple.sum +
    weapon.metadata.purple.sum +
    (anthology ? anthology.metadata.purple.sum : 0)

  const purpleSumPercentage = purpleSum > 0 ? Math.round(purpleSum / total * 10000) / 100 : 0
  const purpleValues = data.filter((v) => isRankTypeOfPurple(facet, v))

  const goldenSum =
    newbie.metadata.golden.sum +
    permanent.metadata.golden.sum +
    character.metadata.golden.sum +
    weapon.metadata.golden.sum +
    (anthology ? anthology.metadata.golden.sum : 0)

  const goldenSumPercentage = goldenSum > 0 ? Math.round(goldenSum / total * 10000) / 100 : 0
  const goldenValues = Array.from(newbie.metadata.golden.values)
    .concat(Array.from(permanent.metadata.golden.values))
    .concat(Array.from(character.metadata.golden.values))
    .concat(Array.from(weapon.metadata.golden.values))
    .concat(anthology ? Array.from(anthology.metadata.golden.values) : [])
    .sort(sortGachaRecordById)

  const { goldenSumRestricted, goldenUsedPitySum } = goldenValues.reduce((acc, record) => {
    if (record.restricted) {
      acc.goldenSumRestricted += 1
    }
    acc.goldenUsedPitySum += record.usedPity
    return acc
  }, {
    goldenSumRestricted: 0,
    goldenUsedPitySum: 0
  })

  const goldenSumAverage = goldenSum > 0 ? Math.ceil(Math.round(goldenUsedPitySum / goldenSum * 100) / 100) : 0

  return {
    total,
    firstTime,
    lastTime,
    values: data,
    metadata: {
      blue: {
        sum: blueSum,
        sumPercentage: blueSumPercentage,
        values: blueValues
      },
      purple: {
        sum: purpleSum,
        sumPercentage: purpleSumPercentage,
        values: purpleValues
      },
      golden: {
        sum: goldenSum,
        sumPercentage: goldenSumPercentage,
        values: goldenValues,
        sumAverage: goldenSumAverage,
        sumRestricted: goldenSumRestricted,
        nextPity: 0
      }
    }
  }
}

function computeGachaRecordsMetadata (
  total: number,
  values: GachaRecord[]
): GachaRecordsMetadata {
  const sum = values.length
  const sumPercentage = sum > 0 ? Math.round(sum / total * 10000) / 100 : 0
  return {
    values,
    sum,
    sumPercentage
  }
}

function computeGoldenGachaRecordsMetadata (
  facet: AccountFacet,
  values: GachaRecord[]
): GoldenGachaRecordsMetadata {
  const result: GoldenGachaRecordsMetadata['values'] = []

  let sum = 0
  let pity = 0
  let usedPitySum = 0
  let sumRestricted = 0

  for (const record of values) {
    const isGolden = isRankTypeOfGolden(facet, record)
    pity += 1

    if (isGolden) {
      const restricted = isRestrictedGolden(facet, record)
      const rest = Object.assign({ usedPity: pity, restricted }, record) as GoldenGachaRecordsMetadata['values'][number]
      result.push(rest)

      sum += 1
      usedPitySum += pity
      pity = 0
      if (restricted) {
        sumRestricted += 1
      }
    }
  }

  const total = values.length
  const sumPercentage = sum > 0 ? Math.round(sum / total * 10000) / 100 : 0
  const sumAverage = sum > 0 ? Math.ceil(Math.round(usedPitySum / sum * 100) / 100) : 0

  return {
    values: result,
    sum,
    sumPercentage,
    sumAverage,
    sumRestricted,
    nextPity: pity
  }
}

function isRestrictedGolden (
  facet: AccountFacet,
  record: GachaRecord
): boolean {
  switch (facet) {
    case AccountFacet.Genshin:
      return !KnownGenshinPermanentGoldenNames.includes(record.name)
    case AccountFacet.StarRail:
      return !KnownStarRailPermanentGoldenItemIds.includes(record.item_id)
    case AccountFacet.ZenlessZoneZero:
      // HACK: Bangboo no need!
      if (record.gacha_type === '5') {
        return false
      } else {
        return !KnownZenlessZoneZeroPermanentGoldenItemIds.includes(record.item_id)
      }
    default:
      throw new Error(`Unknown facet: ${facet}`)
  }
}

// TODO: Genshin Impact and Honkai: Star Rail restricted golden
//   Temporary use of embedded resources

const KnownGenshinPermanentGoldenNames: string[] = [
  '琴', '迪卢克', '七七', '莫娜', '刻晴', '提纳里', '迪希雅',
  '风鹰剑', '天空之刃', '天空之傲', '狼的末路', '天空之脊',
  '和璞鸢', '天空之卷', '四风原典', '天空之翼', '阿莫斯之弓'
]

const KnownStarRailPermanentGoldenItemIds: string[] = [
  '1003', '1004', '1101', '1104', '1107', '1209', '1211',
  '23000', '23002', '23003', '23004', '23005', '23012', '23013'
]

const KnownZenlessZoneZeroPermanentGoldenItemIds: string[] = [
  '1021', '1041', '1101', '1141', '1181', '1211',
  '14102', '14104', '14110', '14114', '14118', '14121'
]
