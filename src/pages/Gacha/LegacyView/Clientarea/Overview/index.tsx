import React from 'react'
import { makeStyles } from '@fluentui/react-components'
import { useSuspenseQuery } from '@tanstack/react-query'
import { selectedAccountQueryOptions } from '@/api/queries/account'
import { prettizedGachaRecordsQueryOptions } from '@/api/queries/business'
import useBusiness from '@/hooks/useBusiness'
import { ReversedBusinesses } from '@/interfaces/Business'
import { CategorizedMetadataRankings, PrettizedGachaRecords, PrettyCategory } from '@/interfaces/GachaRecord'
import GachaItem from '@/pages/Gacha/LegacyView/GachaItem'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
})

export default function GachaLegacyViewClientareaOverview () {
  const classes = useStyles()

  const { business, keyofBusinesses } = useBusiness()
  const { data: selectedAccount } = useSuspenseQuery(selectedAccountQueryOptions(keyofBusinesses))
  const { data: prettized } = useSuspenseQuery(prettizedGachaRecordsQueryOptions(business, selectedAccount?.uid ?? null))

  if (!prettized) {
    return null
  }

  return (
    <div className={classes.root}>
      <CategorizedGachaItemList prettized={prettized} category={PrettyCategory.Character} ranking="golden" />
      <CategorizedGachaItemList prettized={prettized} category={PrettyCategory.Weapon} ranking="golden" />
      <CategorizedGachaItemList prettized={prettized} category={PrettyCategory.Permanent} ranking="golden" />
      {/* <CategorizedGachaItemList prettized={prettized} ranking="golden" /> */}
    </div>
  )
}

// FIXME: TEST CODE
const useStyles2 = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
})

interface Props {
  prettized: PrettizedGachaRecords
  category?: PrettyCategory
  ranking: keyof CategorizedMetadataRankings
}

function CategorizedGachaItemList (props: Props) {
  const classes = useStyles2()
  const { prettized, category, ranking } = props
  const keyofBusinesses = ReversedBusinesses[prettized.business]
  const values = category
    ? prettized.categorizeds[category]?.rankings[ranking].values ?? []
    : prettized.aggregated.rankings[ranking].values

  return (
    <div>
      <p>{category}</p>
      <div className={classes.root}>
        {values.map((record) => (
          <GachaItem
            key={record.id}
            keyofBusinesses={keyofBusinesses}
            ranking={ranking}
            record={record}
          />
        ))}
      </div>
    </div>
  )
}
