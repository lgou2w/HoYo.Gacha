import { useCallback } from 'react'
import { KnownI18nNs, useI18n } from '@/i18n'
import { StatsRecord } from '@/routes/Gacha/api/stats'

export default function useStatsRecordTooltip () {
  const { t, dayjs } = useI18n({
    ns: KnownI18nNs.GachaPage,
    scope: 'StatsRecordTooltip',
  })

  return useCallback(
    (input: Pick<
      StatsRecord,
      | 'itemName'
      | 'version'
      | 'genshinImpactCharacter2'
      | 'time'
    >,
    ): string => {
      return [
        input.itemName,
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
