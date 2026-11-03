import { ReactNode, useMemo } from 'react'
import { Caption1, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { AccountBusiness } from '@/api/Account'
import Placeholder from '@/components/Placeholder'
import { KnownI18nNs, useI18n } from '@/i18n'
import { BannerStats, Rarity } from '@/routes/Gacha/api/stats'
import NumericValue from '@/routes/Gacha/components/Clientarea/Analysis/NumericValue'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import capitalize from '@/utilities/capitalize'
import { ColumnItemDerived } from './types'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS,
  },
  group: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  groupAverage: { color: tokens.colorPaletteGreenForeground1 },
  groupAverageAndUp: { color: tokens.colorPaletteGreenForeground1 },
  groupUpWin: { color: tokens.colorPaletteRedForeground1 },
  groupUp: { color: tokens.colorPaletteRedForeground1 },
  groupGolden: { color: tokens.colorPaletteMarigoldForeground1 },
  groupPurple: { color: tokens.colorPaletteBerryForeground1 },
  groupBlue: { color: tokens.colorPaletteBlueBorderActive },
  groupGreen: { color: tokens.colorPaletteGreenForeground1 },
})

interface LabelsProps {
  dataset: BannerStats<AccountBusiness>
  derived: ColumnItemDerived
}

enum LabelRowKind {
  Average = 'Average',
  AverageAndUp = 'AverageAndUp',
  UpWin = 'UpWin',
  Up = 'Up',
}

const LabelRowPlaceholder = 'Placeholder'
type LabelRowPlaceholder = typeof LabelRowPlaceholder

type LabelRow = {
  className?: string
  kind: LabelRowKind | Rarity
  label: string
  value: ReactNode
} | {
  kind: LabelRowPlaceholder
  key: string
}

export default function ColumnItemLabels (props: LabelsProps) {
  const { dataset, derived: d } = props
  const styles = useStyles()

  const { rarity: { golden, purple, blue, green } } = dataset
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const business = useBusiness()
  const rows = useMemo<LabelRow[]>(() => {
    const rarityKey = (r: Rarity) => t(`Common:${business.keyof}.Gacha.Rarity.${capitalize(r)}`)
    const rowLabel = (k: string) => t(`Clientarea.Analysis.Remastered.ColumnItem.Labels.${k}`)

    const result: LabelRow[] = []

    if (d.hasUp) {
      result.push({
        className: styles.groupAverageAndUp,
        kind: LabelRowKind.AverageAndUp,
        label: `${rarityKey(Rarity.Golden)} ${rowLabel(LabelRowKind.AverageAndUp)}`,
        value: <NumericValue sum={golden.average} pct={golden.up.average} average />,
      }, {
        className: styles.groupUpWin,
        kind: LabelRowKind.UpWin,
        label: `${rarityKey(Rarity.Golden)} ${rowLabel(LabelRowKind.UpWin)}`,
        value: <NumericValue sum={golden.upWin.sum} pct={golden.upWin.percentage} />,
      }, {
        className: styles.groupUp,
        kind: LabelRowKind.Up,
        label: `${rarityKey(Rarity.Golden)} ${rowLabel(LabelRowKind.Up)}`,
        value: <NumericValue sum={golden.up.sum} pct={golden.up.percentage} />,
      })
    } else if (!d.isPermanentOde && !d.isEventOde) {
      result.push({
        className: styles.groupAverage,
        kind: LabelRowKind.Average,
        label: `${rarityKey(Rarity.Golden)} ${rowLabel(LabelRowKind.Average)}`,
        value: <NumericValue sum={golden.average} pct={0} average />,
      }, {
        kind: LabelRowPlaceholder,
        key: 'placeholder-1',
      }, {
        kind: LabelRowPlaceholder,
        key: 'placeholder-2',
      })
    }

    const counts: [boolean, Rarity, number | undefined, number | undefined, string?][] = [
      [!d.isPermanentOde, Rarity.Golden, golden.sum, golden.percentage, styles.groupGolden],
      [true, Rarity.Purple, purple.sum, purple.percentage, styles.groupPurple],
      [true, Rarity.Blue, blue.sum, blue.percentage, styles.groupBlue],
      [d.isPermanentOde && !!green, Rarity.Green, green?.sum, green?.percentage, styles.groupGreen],
    ]

    for (const [predicate, rarity, sum, pct, className] of counts) {
      if (predicate) {
        result.push({
          className,
          kind: rarity,
          label: `${rarityKey(rarity)} ${rowLabel('Count')}`,
          value: <NumericValue sum={sum || 0} pct={pct || 0} />,
        })
      }
    }

    return result
  }, [t, business.keyof, d, golden, purple, blue, green, styles])

  return (
    <div className={styles.root}>
      {rows.map((row) => {
        if ('kind' in row && row.kind === LabelRowPlaceholder) {
          return (
            <Caption1 key={row.key}>
              <Placeholder />
            </Caption1>
          )
        } else if ('label' in row) {
          return (
            <div key={row.kind} className={mergeClasses(styles.group, row.className)}>
              <Caption1>
                {row.label}
              </Caption1>
              <Caption1>
                {row.value}
              </Caption1>
            </div>
          )
        }
      })}
    </div>
  )
}
