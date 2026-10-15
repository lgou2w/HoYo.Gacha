import { ReactNode, useMemo } from 'react'
import { Caption1, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { AccountBusiness } from '@/api/Account'
import Placeholder from '@/components/Placeholder'
import { KnownI18nNs, useI18n } from '@/i18n'
import { BannerStats, Rarity } from '@/routes/Gacha/api/stats'
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
  numeric: {
    fontFamily: tokens.fontFamilyNumeric,
  },
  separator: {
    color: tokens.colorNeutralForeground1,
  },
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
    const rowLabel = (k: string) => t(`Clientarea.Analysis.ColumnItem.Labels.${k}`)

    const result: LabelRow[] = []

    if (d.hasUp) {
      result.push({
        className: styles.groupAverageAndUp,
        kind: LabelRowKind.AverageAndUp,
        label: `${rarityKey(Rarity.Golden)} ${rowLabel(LabelRowKind.AverageAndUp)}`,
        value: (
          <>
            <span className={styles.numeric}>{golden.average}</span>
            <span className={styles.separator}>{` / `}</span>
            <span className={styles.numeric}>{golden.up.average}</span>
          </>
        ),
      }, {
        className: styles.groupUpWin,
        kind: LabelRowKind.UpWin,
        label: `${rarityKey(Rarity.Golden)} ${rowLabel(LabelRowKind.UpWin)}`,
        value: <NumericValue styles={styles} sum={golden.upWin.sum} percentage={golden.upWin.percentage} />,
      }, {
        className: styles.groupUp,
        kind: LabelRowKind.Up,
        label: `${rarityKey(Rarity.Golden)} ${rowLabel(LabelRowKind.Up)}`,
        value: <NumericValue styles={styles} sum={golden.up.sum} percentage={golden.up.percentage} />,
      })
    } else if (!d.isPermanentOde && !d.isEventOde) {
      result.push({
        className: styles.groupAverage,
        kind: LabelRowKind.Average,
        label: `${rarityKey(Rarity.Golden)} ${rowLabel(LabelRowKind.Average)}`,
        value: <span className={styles.numeric}>{golden.average}</span>,
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
          value: <NumericValue styles={styles} sum={sum || 0} percentage={pct || 0} />,
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

interface NumericValueProps {
  styles: ReturnType<typeof useStyles>
  sum: number
  percentage: number
}

function NumericValue (props: NumericValueProps) {
  const { styles, sum, percentage } = props
  return (
    <>
      <span className={styles.numeric}>
        {sum}
      </span>
      <span className={styles.separator}>
        {` [ `}
      </span>
      <span className={styles.numeric}>
        {`${percentage}%`}
      </span>
      <span className={styles.separator}>
        {` ]`}
      </span>
    </>
  )
}
