import { useCallback } from 'react'
import { KeyofAccountBusiness } from '@/api/Account'
import { KnownI18nNs, useI18n } from '@/i18n'
import { BannerCategory, StatsRecord } from '@/routes/Gacha/api/stats'

export interface StatsRecordTooltipArgs {
  keyof: KeyofAccountBusiness
  input: Pick<
    StatsRecord,
    | 'itemName'
    | 'version'
    | 'genshinImpactCharacter2'
    | 'time'
  >
  category?: BannerCategory | null
}

export default function useStatsRecordTooltip () {
  const { t, dayjs } = useI18n({
    ns: KnownI18nNs.GachaPage,
    scope: 'StatsRecordTooltip',
  })

  return useCallback(
    (args: StatsRecordTooltipArgs): string => {
      const { keyof, input, category } = args
      return [
        input.itemName,
        category && t('Banner', { keyof, category }),
        input.version && t('Version', { value: input.version }),
        input.genshinImpactCharacter2 && t('GenshinImpactCharacter2'),
        dayjs(input.time).format('LLLL'),
      ]
        .filter((el) => typeof el === 'string')
        .join('\n')
    },
    [t, dayjs],
  )
}
