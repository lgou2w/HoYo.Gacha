import { ChangeEventHandler, ComponentType, LazyExoticComponent, Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { Spinner, Switch, makeStyles, switchClassNames, tokens } from '@fluentui/react-components'
import { WithTransKnownNs, useI18n } from '@/i18n'
import ClientareaLastUpdated from '@/pages/Gacha/components/Clientarea/LastUpdated'
import { usePrettizedRecords } from '@/pages/Gacha/contexts/PrettizedRecords'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
  wrapper: {
    display: 'inline-flex',
    flex: '0 0 auto',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switcher: {
    [`& .${switchClassNames.indicator}`]: {
      margin: 0,
    },
    [`& .${switchClassNames.label}`]: {
      padding: 0,
      paddingLeft: tokens.spacingHorizontalS,
    },
  },
})

export default function AnalysisView () {
  const styles = useStyles()
  const { useClassic, handleChange, Component } = useAnalysisVersion()
  const { t } = useI18n(WithTransKnownNs.GachaPage)
  const { data } = usePrettizedRecords()

  // FIXME: This situation usually occurs when no accounts are available.
  //   Users need to be instructed to create one manually.
  if (!data) {
    return null
  }

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        <ClientareaLastUpdated />
        <Switch
          className={styles.switcher}
          checked={useClassic}
          onChange={handleChange}
          label={t('Clientarea.Analysis.VersionSwitcher')}
          labelPosition="after"
          size="medium"
        />
      </div>
      <Suspense fallback={<Spinner />}>
        <Component />
      </Suspense>
    </div>
  )
}

// 'Classic' and 'Remastered' versions
enum Version {
  Classic = 'Classic',
  Remastered = 'Remastered',
}

const VersionComponents = Object
  .values(Version)
  .reduce((acc, version) => {
    acc[version] = lazy(() => import(`./${version}/index.tsx`))
    return acc
  }, {} as Record<Version, LazyExoticComponent<ComponentType>>)

const KeyAnalysisUseClassic = 'HG_ANALYSIS_USE_LEGACY'

function useAnalysisVersion () {
  const initialUseClassic = localStorage.getItem(KeyAnalysisUseClassic) === 'true'
  const [useClassic, setUseClassic] = useState(initialUseClassic)

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((evt) => {
    const checked = evt.currentTarget.checked
    localStorage.setItem(KeyAnalysisUseClassic, String(checked))
    setUseClassic(checked)
  }, [])

  const Component = useMemo(
    () => VersionComponents[useClassic ? Version.Classic : Version.Remastered],
    [useClassic],
  )

  return {
    useClassic,
    handleChange,
    Component,
  }
}
