import React from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import useI18n from '@/hooks/useI18n'
import GachaLegacyViewClientareaLastUpdated from '@/pages/Gacha/LegacyView/Clientarea/LastUpdated'
import useCompositeState from '@/pages/Gacha/LegacyView/Clientarea/useCompositeState'
import GachaLegacyViewClientareaAnalysisCards from './Cards'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    height: '100%',
  },
})

export default function GachaLegacyViewClientareaAnalysis () {
  const styles = useStyles()
  const i18n = useI18n()
  const state = useCompositeState(i18n.constants.gacha)
  if (!state) {
    // TODO: Tell the user to fetch or import records
    return null
  }

  return (
    <div className={styles.root}>
      <GachaLegacyViewClientareaLastUpdated {...state} />
      <GachaLegacyViewClientareaAnalysisCards {...state} />
    </div>
  )
}
