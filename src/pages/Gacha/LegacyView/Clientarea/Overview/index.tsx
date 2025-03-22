import React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { useSelectedAccountSuspenseQueryData } from '@/api/queries/accounts'
import { usePrettizedGachaRecordsSuspenseQueryData } from '@/api/queries/business'
import useBusinessContext from '@/hooks/useBusinessContext'
import GachaLegacyViewClientareaOverviewGrid from './Grid'
import GachaLegacyViewClientareaOverviewLastUpdated from './LastUpdated'
import GachaLegacyViewClientareaOverviewTooltips from './Tooltips'
import { ParentCompositeState } from './declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
})

export default function GachaLegacyViewClientareaOverview () {
  const styles = useStyles()
  const { business, keyofBusinesses } = useBusinessContext()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const prettized = usePrettizedGachaRecordsSuspenseQueryData(business, selectedAccount?.uid)

  if (!selectedAccount) {
    return null
  }

  if (!prettized) {
    // TODO: Tell the user to fetch or import records
    return null
  }

  const state: ParentCompositeState = {
    business,
    keyofBusinesses,
    selectedAccount,
    prettized,
  }

  return (
    <div className={styles.root}>
      <GachaLegacyViewClientareaOverviewLastUpdated {...state} />
      <GachaLegacyViewClientareaOverviewGrid {...state} />
      <GachaLegacyViewClientareaOverviewTooltips {...state} />
    </div>
  )
}
