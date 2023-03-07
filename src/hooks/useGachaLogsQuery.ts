import { useQuery } from '@tanstack/react-query'
import { GachaLogItem } from '@/interfaces/models'
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
  values: Array<GachaLogItem & { usedPity: number }>
  sumAverage: number
  nextPity: number
}

export interface NamedGachaLogs {
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
  namedValues: {
    newbie: NamedGachaLogs
    permanent: NamedGachaLogs
    character: NamedGachaLogs
    weapon: NamedGachaLogs
    aggregated: NamedGachaLogs
  }
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

  const namedValues: GroupedGachaLogs['namedValues'] = {
    newbie: computeGroupedNamed(Array.from(values[100])),
    permanent: computeGroupedNamed(Array.from(values[200])),
    character: computeGroupedNamed(Array.from(values[301])
      .concat(values[400])
      .sort((a, b) => a.id.localeCompare(b.id))),
    weapon: computeGroupedNamed(Array.from(values[302])),
    aggregated: computeGroupedNamed(data)
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

function computeGroupedNamed (data: GachaLogItem[]): NamedGachaLogs {
  const total = data.length
  const blue = computeGachaLogsMetadata(total, data.filter(item => item.rankType === '3'))
  const purple = computeGachaLogsMetadata(total, data.filter(item => item.rankType === '4'))
  const golden = computeGoldenGachaLogsMetadata(data)

  return {
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
  for (const item of data) {
    const isGold = item.rankType === '5'
    pity += 1
    if (isGold) {
      values.push(Object.assign({ usedPity: pity }, item))
      sum += 1
      usedPitySum += pity
      pity = 0
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
    nextPity: pity
  }
}
