import { Account, Business, Businesses } from '@/api/interfaces/account'
import {
  GachaRecord,
  GachaRecordRank,
  GachaRecordRanks,
  isRankBlueGachaRecord,
  isRankOrangeGachaRecord,
  isRankPurpleGachaRecord,
  sortGachaRecord
} from '@/api/interfaces/gacha'

export interface CategorizedGachaRecordsMetadata<T = Business> {
  values: GachaRecord<T>[]
  sum: number
  sumPercentage: number
}

export type CategorizedGachaRecordsOrangeMetadataRecord<T = Business>
  = GachaRecord<T> & {
    usedPity: number
    restricted: true | undefined
  }

export interface CategorizedGachaRecordsOrangeMetadata<T = Business>
  extends CategorizedGachaRecordsMetadata<T> {
  values: CategorizedGachaRecordsOrangeMetadataRecord<T>[]
  sumAverage: number
  sumRestricted: number
  nextPity: number
}

export interface CategorizedGachaRecords<T = Business> {
  category: 'Beginner' | 'Permanent' | 'Character' | 'Weapon' | 'Chronicled' | 'Bangboo'
  values: GachaRecord<T>[]
  total: number
  gachaType: GachaRecord<T>['gachaType']
  lastEndId: GachaRecord<T>['id'] | null
  firstTime: GachaRecord<T>['time'] | null
  lastTime: GachaRecord<T>['time'] | null
  metadata: {
    [GachaRecordRanks.Blue]: CategorizedGachaRecordsMetadata<T>,
    [GachaRecordRanks.Purple]: CategorizedGachaRecordsMetadata<T>,
    [GachaRecordRanks.Orange]: CategorizedGachaRecordsOrangeMetadata<T>,
  }
}

export interface PrettiedGachaRecords<T = Business> {
  business: T
  uid: Account['uid']
  total: number
  firstTime: GachaRecord<T>['time'] | null
  lastTime: GachaRecord<T>['time'] | null
  gachaTypeRecords: Partial<Record<GachaRecord<T>['gachaType'], GachaRecord<T>[]>>
  gachaTypeToCategories: Record<GachaRecord<T>['gachaType'], CategorizedGachaRecords<T>['category']>
  aggregated: Omit<CategorizedGachaRecords<T>, 'category' | 'gachaType' | 'lastEndId'>
  categorizeds: Partial<Record<CategorizedGachaRecords<T>['category'], CategorizedGachaRecords<T>>>
}

export interface IsRestrictedOrange<T = Business> {
  (business: T, record: GachaRecord<T>): boolean
}

export default function prettiedGachaRecords<T = Business> (
  business: T,
  uid: Account['uid'],
  records: GachaRecord<T>[],
  isRestrictedOrange: IsRestrictedOrange<T> = () => false
): PrettiedGachaRecords<T> {
  const total = records.length
  const firstTime = records[0]?.time ?? null
  const lastTime = records[total - 1]?.time ?? null
  const gachaTypeRecords = records.reduce((acc, record) => {
    const gachaType = record.gachaType as GachaRecord<T>['gachaType']
    ;(acc[gachaType] || (acc[gachaType] = [])).push(record)
    return acc
  }, {} as PrettiedGachaRecords<T>['gachaTypeRecords'])

  const categorizeds = computeCategorizedGachaRecords(business, gachaTypeRecords, isRestrictedOrange)
  const aggregated = computeAggregatedGachaRecords(business, records, categorizeds)
  const gachaTypeToCategories = Object
    .values(categorizeds)
    .reduce((acc, categorized) => {
      categorized && (acc[categorized.gachaType] = categorized.category)
      return acc
    }, {} as PrettiedGachaRecords<T>['gachaTypeToCategories'])

  return {
    business,
    uid,
    total,
    firstTime,
    lastTime,
    gachaTypeRecords,
    gachaTypeToCategories,
    aggregated,
    categorizeds
  } as PrettiedGachaRecords<T>
}

const KnownCategorizeds: Record<Business, Record<GachaRecord['gachaType'], CategorizedGachaRecords['category']>> = {
  [Businesses.GenshinImpact]: {
    100: 'Beginner',
    200: 'Permanent',
    301: 'Character', // Include: 400
    302: 'Weapon',
    500: 'Chronicled'
  },
  [Businesses.HonkaiStarRail]: {
    2: 'Beginner',
    1: 'Permanent',
    11: 'Character',
    12: 'Weapon'
  },
  [Businesses.ZenlessZoneZero]: {
    1: 'Permanent',
    2: 'Character',
    3: 'Weapon',
    5: 'Bangboo'
  }
}

function concatCategorizedGachaRecords<T = Business> (
  business: T,
  gachaTypeRecords: PrettiedGachaRecords<T>['gachaTypeRecords'],
  gachaType: keyof PrettiedGachaRecords<T>['gachaTypeRecords'],
  category: CategorizedGachaRecords['category']
): GachaRecord<T>[] {
  const records = gachaTypeRecords[gachaType] || []

  // HACK: Genshin Impact: 301 and 400 are the character gacha type
  if (business === Businesses.GenshinImpact && category === 'Character') {
    return Array.from(records)
      .concat('400' in gachaTypeRecords ? gachaTypeRecords['400'] as GachaRecord<T>[] : [])
      .sort(sortGachaRecord)
  } else {
    return Array.from(records)
  }
}

function computeCategorizedGachaRecords<T = Business> (
  business: T,
  gachaTypeRecords: PrettiedGachaRecords<T>['gachaTypeRecords'],
  isRestrictedOrange: IsRestrictedOrange<T>
): PrettiedGachaRecords<T>['categorizeds'] {
  const cateorizeds = KnownCategorizeds[business as Business]
  return Object
    .entries(cateorizeds)
    .reduce((acc, [gachaType, category]) => {
      const records = concatCategorizedGachaRecords(
        business,
        gachaTypeRecords,
        gachaType as unknown as keyof typeof gachaTypeRecords,
        category
      )

      const total = records.length
      const lastEndId = records[total - 1]?.id as GachaRecord<T>['id'] ?? null
      const firstTime = records[0]?.time as GachaRecord<T>['time'] ?? null
      const lastTime = records[total - 1]?.time as GachaRecord<T>['time'] ?? null
      const metadata: CategorizedGachaRecords<T>['metadata'] = {
        [GachaRecordRanks.Blue]: computeCategorizedGachaRecordsMetadata(total, records.filter(isRankBlueGachaRecord)),
        [GachaRecordRanks.Purple]: computeCategorizedGachaRecordsMetadata(total, records.filter(isRankPurpleGachaRecord)),
        [GachaRecordRanks.Orange]: computeCategorizedGachaRecordsOrangeMetadata(business, records, isRestrictedOrange)
      }

      acc[category] = {
        category,
        values: records,
        total,
        gachaType: +gachaType as GachaRecord<T>['gachaType'],
        lastEndId,
        firstTime,
        lastTime,
        metadata
      }

      return acc
    }, {} as PrettiedGachaRecords<T>['categorizeds'])
}

function computeAggregatedGachaRecords<T = Business> (
  _business: T,
  records: GachaRecord<T>[],
  categorizeds: PrettiedGachaRecords<T>['categorizeds']
): PrettiedGachaRecords<T>['aggregated'] {
  const total = records.length
  const firstTime = records[0]?.time as GachaRecord<T>['time'] ?? null
  const lastTime = records[total - 1]?.time as GachaRecord<T>['time'] ?? null

  const {
    [GachaRecordRanks.Blue]: blueSum,
    [GachaRecordRanks.Purple]: purpleSum,
    [GachaRecordRanks.Orange]: orangeSum
  } = computeCategorizedGachaRecordsMetadataSumValues(categorizeds)

  const blueSumPercentage = blueSum > 0 ? Math.round(blueSum / total * 10000) / 100 : 0
  const blueValues = records.filter(isRankBlueGachaRecord)

  const purpleSumPercentage = purpleSum > 0 ? Math.round(purpleSum / total * 10000) / 100 : 0
  const purpleValues = records.filter(isRankPurpleGachaRecord)

  const orangeSumPercentage = orangeSum > 0 ? Math.round(orangeSum / total * 10000) / 100 : 0
  const orangeValues =
    Array.from(categorizeds.Beginner?.metadata[GachaRecordRanks.Orange].values || [])
      .concat(categorizeds.Permanent?.metadata[GachaRecordRanks.Orange].values || [])
      .concat(categorizeds.Character?.metadata[GachaRecordRanks.Orange].values || [])
      .concat(categorizeds.Weapon?.metadata[GachaRecordRanks.Orange].values || [])
      .concat(categorizeds.Chronicled?.metadata[GachaRecordRanks.Orange].values || [])
      .sort(sortGachaRecord)

  const {
    orangeSumRestricted,
    orangeUsedPitySum
  } = orangeValues.reduce((acc, record) => {
    record.restricted && (acc.orangeSumRestricted += 1)
    acc.orangeUsedPitySum += record.usedPity
    return acc
  }, {
    orangeSumRestricted: 0,
    orangeUsedPitySum: 0
  })

  const orangeSumAverage = orangeSum > 0 ? Math.ceil(Math.round(orangeUsedPitySum / orangeSum * 100) / 100) : 0

  return {
    values: records,
    total,
    firstTime,
    lastTime,
    metadata: {
      [GachaRecordRanks.Blue]: {
        sum: blueSum,
        sumPercentage: blueSumPercentage,
        values: blueValues
      },
      [GachaRecordRanks.Purple]: {
        sum: purpleSum,
        sumPercentage: purpleSumPercentage,
        values: purpleValues
      },
      [GachaRecordRanks.Orange]: {
        sum: orangeSum,
        sumPercentage: orangeSumPercentage,
        values: orangeValues,
        sumAverage: orangeSumAverage,
        sumRestricted: orangeSumRestricted,
        nextPity: 0
      }
    }
  }
}

function computeCategorizedGachaRecordsMetadataSumValues<T = Business> (
  categorizeds: PrettiedGachaRecords<T>['categorizeds']
): Record<GachaRecordRank, number> {
  // Lazy initialize
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const values: Record<GachaRecordRank, number> = {}

  for (const keyofRanks in GachaRecordRanks) {
    const rank = GachaRecordRanks[keyofRanks as keyof typeof GachaRecordRanks]

    if (!values[rank]) {
      values[rank] = 0
    }

    Object
      .values(categorizeds)
      .forEach((categorized) => {
        values[rank] += categorized?.metadata[rank].sum || 0
      })
  }

  return values
}

function computeCategorizedGachaRecordsMetadata<T = Business> (
  total: number,
  values: GachaRecord<T>[]
): CategorizedGachaRecordsMetadata<T> {
  const sum = values.length
  const sumPercentage = sum > 0 ? Math.round(sum / total * 10000) / 100 : 0
  return {
    values,
    sum,
    sumPercentage
  }
}

function computeCategorizedGachaRecordsOrangeMetadata<T = Business> (
  business: T,
  records: GachaRecord<T>[],
  isRestrictedOrange: IsRestrictedOrange<T>
): CategorizedGachaRecordsOrangeMetadata<T> {
  const values: CategorizedGachaRecordsOrangeMetadata<T>['values'] = []

  let sum = 0
  let pity = 0
  let usedPitySum = 0
  let sumRestricted = 0

  for (const record of records) {
    const isOrange = isRankOrangeGachaRecord(record)
    pity += 1

    if (isOrange) {
      const restricted = isRestrictedOrange(business, record)
      const rest = Object.assign({ usedPity: pity, restricted }, record)
      values.push(rest as CategorizedGachaRecordsOrangeMetadataRecord<T>)

      sum += 1
      usedPitySum += pity
      pity = 0
      if (restricted) {
        sumRestricted += 1
      }
    }
  }

  const total = records.length
  const sumPercentage = sum > 0 ? Math.round(sum / total * 10000) / 100 : 0
  const sumAverage = sum > 0 ? Math.ceil(Math.round(usedPitySum / sum * 100) / 100) : 0

  return {
    values,
    sum,
    sumPercentage,
    sumAverage,
    sumRestricted,
    nextPity: pity
  }
}
