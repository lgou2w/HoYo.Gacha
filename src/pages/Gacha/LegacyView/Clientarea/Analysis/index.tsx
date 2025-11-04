import React, { ChangeEventHandler, Fragment, NamedExoticComponent, useCallback, useState } from 'react'
import { Switch, makeStyles, switchClassNames, tokens } from '@fluentui/react-components'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import GachaLegacyViewClientareaLastUpdated from '@/pages/Gacha/LegacyView/Clientarea/LastUpdated'
import useCompositeState from '@/pages/Gacha/LegacyView/Clientarea/useCompositeState'
import GachaLegacyViewClientareaAnalysisCards from './Cards'
import GachaLegacyViewClientareaAnalysisLegacy from './Legacy'

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

  const Fresh = React.memo(function AnalysisFresh () {
    return <GachaLegacyViewClientareaAnalysisCards {...state} />
  })

  const Legacy = React.memo(function AnalysisLegacy () {
    return <GachaLegacyViewClientareaAnalysisLegacy {...state} />
  })

  return (
    <div className={styles.root}>
      <GachaLegacyViewClientareaAnalysisSwitcher
        title={<GachaLegacyViewClientareaLastUpdated {...state} />}
        components={[Fresh, Legacy]}
      />
    </div>
  )
}

const useSwitcherStyles = makeStyles({
  title: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switch: {
    [`& .${switchClassNames.input}`]: {
      width: '2rem',
      [`&:checked ~ .${switchClassNames.indicator} > *`]: {
        transform: 'translateX(1rem)',
      },
    },
    [`& .${switchClassNames.indicator}`]: {
      fontSize: '0.875rem',
      height: '1rem',
      width: '2rem',
      margin: 0,
    },
    [`& .${switchClassNames.label}`]: {
      fontSize: tokens.fontSizeBase200,
      lineHeight: tokens.lineHeightBase200,
      padding: 0,
      paddingLeft: tokens.spacingHorizontalS,
    },
  },
})

const KeyAnalysisUseLegacy = 'HG_ANALYSIS_USE_LEGACY'

function GachaLegacyViewClientareaAnalysisSwitcher ({
  title,
  components: [Fresh, Legacy],
}: {
  title: React.JSX.Element
  components: [NamedExoticComponent, NamedExoticComponent]
}) {
  const styles = useSwitcherStyles()
  const [useLegacy, setUseLegacy] = useState(localStorage.getItem(KeyAnalysisUseLegacy) === 'true')
  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((evt) => {
    const checked = evt.currentTarget.checked
    localStorage.setItem(KeyAnalysisUseLegacy, String(checked))
    setUseLegacy(checked)
  }, [])

  return (
    <Fragment>
      <div className={styles.title}>
        {title}
        <div aria-hidden />
        <Switch
          className={styles.switch}
          label={<Locale mapping={['Pages.Gacha.LegacyView.Clientarea.Analysis.Switcher.Label']} />}
          onChange={handleChange}
          checked={useLegacy}
        />
      </div>
      {useLegacy ? <Legacy /> : <Fresh />}
    </Fragment>
  )
}
