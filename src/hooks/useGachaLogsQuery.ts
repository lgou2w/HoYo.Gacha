import { useQuery } from '@tanstack/react-query'
import { GachaLogItem } from '@/interfaces/models'
import { PermanentGoldens } from '@/interfaces/genshin-icons'
import Commands from '@/utilities/commands'

export interface UseGachaLogsQueryOptions {
  uid?: number | null
  onError?: (error: unknown) => void
}

export default function useGachaLogsQuery (options: UseGachaLogsQueryOptions) {
  return useQuery({
    queryKey: ['gacha-logs', options.uid],
    queryFn: async () => {
      if (!options.uid) {
        return null
      } else {
        console.debug('Fetch gacha logs:', options.uid)
        const gachaLogs = await Commands.findGachaLogsByUID({ uid: options.uid })
        console.debug('Fetched gacha logs:', gachaLogs.length)
        return computeGrouped(gachaLogs)
      }
    },
    cacheTime: Infinity,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    onError: options.onError
  })
}

export interface GachaLogsMetadata {
  values: GachaLogItem[]
  sum: number
  sumPercentage: number
}

export interface GoldenGachaLogsMetadata extends GachaLogsMetadata {
  values: Array<GachaLogItem & { usedPity: number, restricted?: true }>
  sumAverage: number
  sumRestricted: number
  nextPity: number
}

export type NamedGachaLogsCategory = 'newbie' | 'permanent' | 'character' | 'weapon' | 'aggregated'
export interface NamedGachaLogs {
  category: NamedGachaLogsCategory
  categoryTitle: string
  total: number
  firstTime?: string
  lastTime?: string
  values: GachaLogItem[]
  metadata: {
    blue: GachaLogsMetadata
    purple: GachaLogsMetadata
    golden: GoldenGachaLogsMetadata
  }
}

export interface GroupedGachaLogs {
  total: number
  firstTime?: string
  lastTime?: string
  values: Record<GachaLogItem['gachaType'], GachaLogItem[]>
  namedValues: Record<NamedGachaLogsCategory, NamedGachaLogs>
  fetcherChannelTypeArguments: Partial<Record<GachaLogItem['gachaType'], string>>
}

function computeGrouped (data: GachaLogItem[]): GroupedGachaLogs {
  const start = Date.now()
  console.log('Compute grouped gacha logs...')
  const total = data.length
  const valuesAcc: Record<GachaLogItem['gachaType'], GachaLogItem[]> = { 100: [], 200: [], 301: [], 302: [], 400: [] }
  const values = data.reduce((acc, item) => {
    acc[item.gachaType].push(item)
    return acc
  }, valuesAcc)

  const newbie = computeGroupedNamed('newbie', Array.from(values[100]))
  const permanent = computeGroupedNamed('permanent', Array.from(values[200]))
  const character = computeGroupedNamed('character', Array.from(values[301])
    .concat(Array.from(values[400]))
    .sort(sortGachaLogItemById))
  const weapon = computeGroupedNamed('weapon', Array.from(values[302]))
  const aggregated = computeGroupedNamedAggregated(data, newbie, permanent, character, weapon)
  const namedValues: GroupedGachaLogs['namedValues'] = {
    newbie,
    permanent,
    character,
    weapon,
    aggregated
  }

  const lastCharacterId = values[301][values[301].length - 1]?.id as string | undefined
  const lastCharacter2Id = values[400][values[400].length - 1]?.id as string | undefined
  const fetcherChannelTypeArguments: GroupedGachaLogs['fetcherChannelTypeArguments'] = {
    100: values[100][values[100].length - 1]?.id,
    200: values[200][values[200].length - 1]?.id,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    301: lastCharacterId?.localeCompare(lastCharacter2Id) > 0 ? lastCharacterId : lastCharacter2Id,
    302: values[302][values[302].length - 1]?.id
  }

  const end = Date.now()
  console.log('Computed grouped gacha logs in', end - start, 'ms')

  return {
    total,
    firstTime: data[0]?.time,
    lastTime: data[data.length - 1]?.time,
    values,
    namedValues,
    fetcherChannelTypeArguments
  }
}

const CategoryTitles: Record<NamedGachaLogsCategory, string> = {
  newbie: '新手祈愿',
  character: '角色活动祈愿',
  weapon: '武器活动祈愿',
  permanent: '常驻祈愿',
  aggregated: '合计'
}

function computeGroupedNamed (category: NamedGachaLogsCategory, data: GachaLogItem[]): NamedGachaLogs {
  const total = data.length
  const blue = computeGachaLogsMetadata(total, data.filter(item => item.rankType === '3'))
  const purple = computeGachaLogsMetadata(total, data.filter(item => item.rankType === '4'))
  const golden = computeGoldenGachaLogsMetadata(data)

  return {
    category,
    categoryTitle: CategoryTitles[category],
    total,
    firstTime: data[0]?.time,
    lastTime: data[data.length - 1]?.time,
    values: data,
    metadata: {
      blue,
      purple,
      golden
    }
  }
}

function computeGroupedNamedAggregated (
  data: GachaLogItem[],
  newbie: NamedGachaLogs,
  permanent: NamedGachaLogs,
  character: NamedGachaLogs,
  weapon: NamedGachaLogs
): NamedGachaLogs {
  const total = data.length

  const blueSum = newbie.metadata.blue.sum + permanent.metadata.blue.sum + character.metadata.blue.sum + weapon.metadata.blue.sum
  const blueSumPercentage = blueSum > 0 ? Math.round((blueSum / total) * 10000) / 100 : 0
  const blueValues = data.filter(item => item.rankType === '3')

  const purpleSum = newbie.metadata.purple.sum + permanent.metadata.purple.sum + character.metadata.purple.sum + weapon.metadata.purple.sum
  const purpleSumPercentage = purpleSum > 0 ? Math.round((purpleSum / total) * 10000) / 100 : 0
  const purpleValues = data.filter(item => item.rankType === '4')

  const goldenSum = newbie.metadata.golden.sum + permanent.metadata.golden.sum + character.metadata.golden.sum + weapon.metadata.golden.sum
  const goldenSumPercentage = goldenSum > 0 ? Math.round((goldenSum / total) * 10000) / 100 : 0
  const goldenValues = Array.from(newbie.metadata.golden.values)
    .concat(Array.from(permanent.metadata.golden.values))
    .concat(Array.from(character.metadata.golden.values))
    .concat(Array.from(weapon.metadata.golden.values))
    .sort(sortGachaLogItemById)

  const { goldenSumRestricted, goldenUsedPitySum } = goldenValues.reduce((acc, item) => {
    if (item.restricted) {
      acc.goldenSumRestricted += 1
    }
    acc.goldenUsedPitySum += item.usedPity
    return acc
  }, {
    goldenSumRestricted: 0,
    goldenUsedPitySum: 0
  })

  const goldenSumAverage = goldenSum > 0 ? Math.ceil(Math.round((goldenUsedPitySum / goldenSum) * 100) / 100) : 0

  return {
    category: 'aggregated',
    categoryTitle: CategoryTitles.aggregated,
    total,
    firstTime: data[0]?.time,
    lastTime: data[data.length - 1]?.time,
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
        nextPity: 0 // aggregated not needed
      }
    }
  }
}

function computeGachaLogsMetadata (total: number, ranked: GachaLogItem[]): GachaLogsMetadata {
  const sum = ranked.length
  const sumPercentage = sum > 0 ? Math.round((sum / total) * 10000) / 100 : 0
  return {
    values: ranked,
    sum,
    sumPercentage
  }
}

function computeGoldenGachaLogsMetadata (data: GachaLogItem[]): GoldenGachaLogsMetadata {
  const values: GoldenGachaLogsMetadata['values'] = []
  let sum = 0
  let pity = 0
  let usedPitySum = 0
  let sumRestricted = 0
  for (const item of data) {
    const isGold = item.rankType === '5'
    pity += 1
    if (isGold) {
      const restricted = !PermanentGoldens.includes(item.name) ? true : undefined
      values.push(Object.assign({ usedPity: pity, restricted }, item) as GoldenGachaLogsMetadata['values'][number])
      sum += 1
      usedPitySum += pity
      pity = 0
      if (restricted) {
        sumRestricted += 1
      }
    }
  }

  const total = data.length
  const sumPercentage = sum > 0 ? Math.round((sum / total) * 10000) / 100 : 0
  const sumAverage = sum > 0 ? Math.ceil(Math.round((usedPitySum / sum) * 100) / 100) : 0

  return {
    values,
    sum,
    sumPercentage,
    sumAverage,
    sumRestricted,
    nextPity: pity
  }
}

function sortGachaLogItemById (a: GachaLogItem, b: GachaLogItem): number {
  return a.id.localeCompare(b.id)
}
