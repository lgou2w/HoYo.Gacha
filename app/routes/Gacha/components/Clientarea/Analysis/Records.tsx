import { Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { Caption1, Divider, SelectTabEventHandler, Tab, TabList, Tooltip, makeStyles, mergeClasses, tabClassNames, tokens } from '@fluentui/react-components'
import { AccountBusiness, ZenlessZoneZero } from '@/api/Account'
import { KnownI18nNs, Trans, useI18n } from '@/i18n'
import { BannerCategory, BannerStats, PityRarityStats, Rarity, StatsRecord } from '@/routes/Gacha/api/stats'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import capitalize from '@/utilities/capitalize'
import RecordItem, { RecordItemNextPity, RecordItemWrapper } from './RecordItem'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalS,
  },
})

export interface ColumnItemRecordsProps {
  dataset: BannerStats<AccountBusiness>
}

export default function ColumnItemRecords (props: ColumnItemRecordsProps) {
  const { dataset } = props
  const styles = useStyles()

  const business = useBusiness()
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const [rarity, setRarity] = useState(
    dataset.category === BannerCategory.PermanentOde
      ? Rarity.Purple
      : Rarity.Golden,
  )

  const handleSelectRarity = useCallback<Required<RecordsTabsProps>['onChange']>((_, data) => {
    setRarity(data.value as Rarity)
  }, [])

  // Scroll to the top when switching rarity tabs.
  useEffect(() => {
    virtuosoRef.current?.scrollTo({ top: 0 })
  }, [rarity])

  // Zenless Zone Zero:
  //   Since v3.1 (2026/07/29): Custom Search (定制调频)
  //   https://www.miyoushe.com/zzz/article/76756493
  //   https://www.hoyolab.com/article/45889814
  const shouldRenderNoPurpleUpTooltip = business.toBe(ZenlessZoneZero)
    && rarity === Rarity.Purple
    && (dataset.category === BannerCategory.Character
      || dataset.category === BannerCategory.Weapon
      || dataset.category === BannerCategory.ExclusiveRescreening
      || dataset.category === BannerCategory.WEngineReverberation)

  return (
    <div className={styles.root}>
      <RecordsTabs
        category={dataset.category}
        rarity={rarity}
        onChange={handleSelectRarity}
      />
      {shouldRenderNoPurpleUpTooltip && <RecordsNoPurpleTooltip />}
      <RecordsVirtoso
        ref={virtuosoRef}
        dataset={dataset}
        rarity={rarity}
      />
    </div>
  )
}

const useTabsStyles = makeStyles({
  root: {
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
})

interface RecordsTabsProps {
  category: BannerCategory
  rarity: Rarity
  onChange?: SelectTabEventHandler
}

function RecordsTabs (props: RecordsTabsProps) {
  const { category, rarity, onChange } = props
  const styles = useTabsStyles()

  const availableRarities = useMemo(() => (
    category === BannerCategory.PermanentOde
      ? [Rarity.Purple, Rarity.Blue]
      : [Rarity.Golden, Rarity.Purple]
  ), [category])

  return (
    <TabList
      className={styles.root}
      selectedValue={rarity}
      onTabSelect={onChange}
      appearance="subtle"
      size="small"
    >
      {availableRarities.map((rarity, index) => (
        <RecordsTab
          key={rarity}
          value={rarity}
          isFirst={index === 0}
        />
      ))}
    </TabList>
  )
}

const useTabStyles = makeStyles({
  root: {
    flexGrow: 1,
  },
  [Rarity.Golden]: {
    '&:enabled:hover': {
      [`& .${tabClassNames.content}`]: {
        color: tokens.colorPaletteMarigoldForeground1,
      },
    },
    [`& .${tabClassNames.content}`]: {
      color: tokens.colorPaletteMarigoldForeground1,
    },
  },
  [Rarity.Purple]: {
    '&:enabled:hover': {
      [`& .${tabClassNames.content}`]: {
        color: tokens.colorPaletteBerryForeground1,
      },
    },
    [`& .${tabClassNames.content}`]: {
      color: tokens.colorPaletteBerryForeground1,
    },
  },
  [Rarity.Blue]: {
    '&:enabled:hover': {
      [`& .${tabClassNames.content}`]: {
        color: tokens.colorPaletteBlueBorderActive,
      },
    },
    [`& .${tabClassNames.content}`]: {
      color: tokens.colorPaletteBlueBorderActive,
    },
  },
  [Rarity.Green]: {},
  divider: {
    flexGrow: 0,
  },
})

interface RecordsTabProps {
  value: Rarity
  isFirst?: boolean
}

function RecordsTab (props: RecordsTabProps) {
  const { value, isFirst } = props
  const styles = useTabStyles()

  const { t } = useI18n()
  const business = useBusiness()

  return (
    <>
      {!isFirst && <Divider className={styles.divider} vertical />}
      <Tab
        className={mergeClasses(styles.root, styles[value])}
        value={value}
      >
        {t(`Common:${business.keyof}.Gacha.Rarity.${capitalize(value)}`)}
      </Tab>
    </>
  )
}

const useNoPurpleTooltipStyles = makeStyles({
  root: {
    textAlign: 'right',
  },
  text: {
    color: tokens.colorBrandForeground2,
    borderBottom: `${tokens.strokeWidthThin} dashed ${tokens.colorBrandStroke2}`,
    cursor: 'help',
  },
  brand: { color: tokens.colorBrandForeground1 },
  purple: { color: tokens.colorPaletteBerryForeground1 },
})

function RecordsNoPurpleTooltip () {
  const styles = useNoPurpleTooltipStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const business = useBusiness()

  return (
    <div className={styles.root}>
      <Tooltip
        content={(
          <Trans
            ns={KnownI18nNs.GachaPage}
            i18nKey="Clientarea.Analysis.ColumnItem.Records.NoPurpleUp.Tooltip"
            values={{ keyof: business.keyof }}
            components={{
              1: <span className={styles.brand} />,
              2: <span className={styles.purple} />,
            }}
          />
        )}
        relationship="label"
        positioning="above-end"
        withArrow
      >
        <Caption1 className={styles.text}>
          {t('Clientarea.Analysis.ColumnItem.Records.NoPurpleUp.Text')}
        </Caption1>
      </Tooltip>
    </div>
  )
}

enum RecordsItemKind {
  Item = 'Item',
  Version = 'Version',
  NextPity = 'NextPity',
}

type RecordsItem = {
  kind: RecordsItemKind.Item
  record: StatsRecord
  prevRecord?: StatsRecord | null
} | {
  kind: RecordsItemKind.Version
  version: string
} | {
  kind: RecordsItemKind.NextPity
  value: number
  progress: number
  endTime?: string | null
}

/**
 * Flatten a banner's rarity bucket into the item list consumed by
 * `Virtuoso`.
 *
 * Order before reversing:
 *
 * ```
 * [item][item]...  ← records, oldest first
 * [vA.B]           ← version separator between groups
 * [item][item]...
 * [vC.D]
 * [item]...
 * [next pity]      ← last in array
 * ```
 *
 * `reverse()` flips it so the newest record and the next-pity row appear
 * at the top of the list.
 */
function buildVirtosoItems (
  dataset: BannerStats<AccountBusiness>,
  rarity: Rarity,
  useVersionLabel: boolean,
): RecordsItem[] {
  const bucket = dataset.rarity[rarity]
  const records = bucket?.values || []

  const items: RecordsItem[] = []
  let i = 0
  while (i < records.length) {
    const currVersion = records[i].version
    while (i < records.length && records[i].version === currVersion) {
      items.push({
        kind: RecordsItemKind.Item,
        record: records[i],
        prevRecord: records[i - 1],
      })
      i++
    }

    if (useVersionLabel && currVersion) {
      items.push({
        kind: RecordsItemKind.Version,
        version: currVersion,
      })
    }
  }

  let nextPity: PityRarityStats['nextPity'] | undefined
  if (bucket && 'nextPity' in bucket && typeof (nextPity = bucket.nextPity) === 'object') {
    items.push({
      kind: RecordsItemKind.NextPity,
      value: nextPity.value,
      progress: nextPity.progress,
      endTime: dataset.endTime,
    })
  }

  items.reverse()
  return items
}

const useVirtosoStyles = makeStyles({
  root: {
    display: 'flex',
    flexGrow: 1,
  },
})

interface RecordsVirtosoProps {
  ref?: Ref<VirtuosoHandle>
  dataset: BannerStats<AccountBusiness>
  rarity: Rarity
}

function RecordsVirtoso (props: RecordsVirtosoProps) {
  const { ref, dataset, rarity } = props
  const styles = useVirtosoStyles()

  const items = useMemo(
    () => buildVirtosoItems(dataset, rarity, true),
    [dataset, rarity],
  )

  return (
    <Virtuoso
      className={styles.root}
      ref={ref}
      data={items}
      itemContent={(_, item) => {
        switch (item.kind) {
          case RecordsItemKind.Item:
            return (
              <RecordItemWrapper kind="item">
                <RecordItem
                  category={dataset.category}
                  rarity={rarity}
                  record={item.record}
                  prevRecord={item.prevRecord}
                />
              </RecordItemWrapper>
            )
          case RecordsItemKind.Version:
            return (
              <RecordItemWrapper>
                <Divider inset>
                  {`v${item.version}`}
                </Divider>
              </RecordItemWrapper>
            )
          case RecordsItemKind.NextPity:
            return (
              <RecordItemWrapper kind="item">
                <RecordItemNextPity {...item} />
              </RecordItemWrapper>
            )
        }
      }}
    />
  )
}
