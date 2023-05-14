/* eslint-disable no-use-before-define */

import React from 'react'
import { QueryKey, FetchQueryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { AccountFacet, Account } from '@/interfaces/account'
import { GenshinGachaRecord, StarRailGachaRecord } from '@/interfaces/gacha'
import PluginStorage from '@/utilities/plugin-storage'

type GachaRecord = GenshinGachaRecord | StarRailGachaRecord

// Computed Gacha Records
// See below
export interface GachaRecords {
  readonly facet: AccountFacet
  readonly uid: Account['uid']
  readonly values: Record<GachaRecord['gacha_type'], GachaRecord[]>
  readonly namedValues: Record<NamedGachaRecords['category'], NamedGachaRecords>
  readonly aggregatedValues: Omit<NamedGachaRecords, 'category' | 'gachaType' | 'lastEndId'>
  readonly total: number
  readonly firstTime?: GachaRecord['time']
  readonly lastTime?: GachaRecord['time']
}

export interface NamedGachaRecords {
  category: 'newbie' | 'permanent' | 'character' | 'weapon'
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
    // cacheTime: Infinity // TODO: GachaRecords infinity cache time?
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
    if (!acc[record.gacha_type]) {
      acc[record.gacha_type] = []
    }
    acc[record.gacha_type].push(record)
    return acc
  }, {} as GachaRecords['values'])

  const namedValues = computeNamedGachaRecords(facet, values)
  const aggregatedValues = computeAggregatedGachaRecords(facet, data, namedValues)

  return {
    facet,
    uid,
    total,
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
  302: 'weapon'
}

const KnownStarRailGachaTypes: Record<StarRailGachaRecord['gacha_type'], NamedGachaRecords['category']> = {
  2: 'newbie',
  1: 'permanent',
  11: 'character',
  12: 'weapon'
}

const isRankTypeOfBlue = (record: GachaRecord) => record.rank_type === '3'
const isRankTypeOfPurple = (record: GachaRecord) => record.rank_type === '4'
const isRankTypeOfGolden = (record: GachaRecord) => record.rank_type === '5'
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
      .concat(values['400'])
      .sort(sortGachaRecordById)
  } else {
    return Array.from(data)
  }
}

function computeNamedGachaRecords (
  facet: AccountFacet,
  values: GachaRecords['values']
): GachaRecords['namedValues'] {
  const categories = facet === AccountFacet.Genshin ? KnownGenshinGachaTypes : KnownStarRailGachaTypes
  return Object
    .entries(categories)
    .reduce((acc, [gachaType, category]) => {
      const data = concatNamedGachaRecordsValues(facet, values, gachaType, category)
      const total = data.length
      const lastEndId = data[total - 1]?.id
      const firstTime = data[0]?.time
      const lastTime = data[total - 1]?.time
      const metadata: NamedGachaRecords['metadata'] = {
        blue: computeGachaRecordsMetadata(total, data.filter(isRankTypeOfBlue)),
        purple: computeGachaRecordsMetadata(total, data.filter(isRankTypeOfPurple)),
        golden: computeGoldenGachaRecordsMetadata(facet, data)
      }

      acc[category] = {
        category,
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
  const total = data.length
  const firstTime = data[0]?.time
  const lastTime = data[total - 1]?.time
  const { newbie, permanent, character, weapon } = namedValues

  const blueSum = newbie.metadata.blue.sum + permanent.metadata.blue.sum + character.metadata.blue.sum + weapon.metadata.blue.sum
  const blueSumPercentage = blueSum > 0 ? Math.round(blueSum / total * 10000) / 100 : 0
  const blueValues = data.filter(isRankTypeOfBlue)

  const purpleSum = newbie.metadata.purple.sum + permanent.metadata.purple.sum + character.metadata.purple.sum + weapon.metadata.purple.sum
  const purpleSumPercentage = purpleSum > 0 ? Math.round(purpleSum / total * 10000) / 100 : 0
  const purpleValues = data.filter(isRankTypeOfPurple)

  const goldenSum = newbie.metadata.golden.sum + permanent.metadata.golden.sum + character.metadata.golden.sum + weapon.metadata.golden.sum
  const goldenSumPercentage = goldenSum > 0 ? Math.round(goldenSum / total * 10000) / 100 : 0
  const goldenValues = Array.from(newbie.metadata.golden.values)
    .concat(Array.from(permanent.metadata.golden.values))
    .concat(Array.from(character.metadata.golden.values))
    .concat(Array.from(weapon.metadata.golden.values))
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
    const isGolden = isRankTypeOfGolden(record)
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
  // TODO: Genshin Impact and Honkai: Star Rail restricted golden
  return false
}
