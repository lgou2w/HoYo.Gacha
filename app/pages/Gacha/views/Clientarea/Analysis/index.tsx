import { ChangeEventHandler, ComponentType, LazyExoticComponent, PropsWithChildren, Suspense, createContext, lazy, use, useCallback, useMemo, useState } from 'react'
import { Button, Popover, PopoverSurface, PopoverTrigger, Spinner, Switch, SwitchProps, makeStyles, switchClassNames, tokens } from '@fluentui/react-components'
import { EditSettingsRegular } from '@fluentui/react-icons'
import { WithTransKnownNs, useI18n } from '@/i18n'
import ClientareaLastUpdated from '@/pages/Gacha/components/Clientarea/LastUpdated'
import { useAnalysisVersionLabelMutation, useAnalysisVersionLabelSuspenseQuery } from '@/pages/Gacha/queries/analysis'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalM,
  },
  topbar: {
    display: 'inline-flex',
    flex: '0 0 auto',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})

export default function AnalysisView () {
  const styles = useStyles()
  return (
    <AnalysisProvider>
      <div className={styles.root}>
        <div className={styles.topbar}>
          <ClientareaLastUpdated />
          <Personalization />
        </div>
        <AnalysisComponent />
      </div>
    </AnalysisProvider>
  )
}

// #region: Context

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

interface AnalysisState {
  readonly useClassic: boolean
  readonly handleUseClassicChange: ChangeEventHandler<HTMLInputElement>
}

const AnalysisContext = createContext<AnalysisState | null>(null)

AnalysisContext.displayName = 'AnalysisContext'

function AnalysisProvider (props: PropsWithChildren) {
  const initialUseClassic = localStorage.getItem(KeyAnalysisUseClassic) === 'true'
  const [useClassic, setUseClassic] = useState(initialUseClassic)

  const handleUseClassicChange = useCallback<ChangeEventHandler<HTMLInputElement>>((evt) => {
    const checked = evt.currentTarget.checked
    localStorage.setItem(KeyAnalysisUseClassic, String(checked))
    setUseClassic(checked)
  }, [])

  const state: AnalysisState = {
    useClassic,
    handleUseClassicChange,
  }

  return (
    <AnalysisContext value={state}>
      {props.children}
    </AnalysisContext>
  )
}

function useAnalysis () {
  const state = use(AnalysisContext)
  if (!state) {
    throw new Error('useAnalysis must be used within a AnalysisProvider')
  } else {
    return state
  }
}

// #endregion

function AnalysisComponent () {
  const { useClassic } = useAnalysis()
  const Component = useMemo(
    () => VersionComponents[useClassic ? Version.Classic : Version.Remastered],
    [useClassic],
  )

  return (
    <Suspense fallback={<Spinner />}>
      <Component />
    </Suspense>
  )
}

const usePersonalizationStyles = makeStyles({
  root: {},
  content: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
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

function Personalization () {
  const styles = usePersonalizationStyles()
  const { useClassic, handleUseClassicChange } = useAnalysis()
  const { t } = useI18n(WithTransKnownNs.GachaPage)

  const { data: useVersionLabel } = useAnalysisVersionLabelSuspenseQuery()
  const versionLabelMutation = useAnalysisVersionLabelMutation()
  const handleVersionLabelChange = useCallback<Required<SwitchProps>['onChange']>((_, data) => {
    versionLabelMutation.mutateAsync(data.checked)
  }, [versionLabelMutation])

  return (
    <div className={styles.root}>
      <Popover positioning="before" openOnHover withArrow>
        <PopoverTrigger>
          <Button appearance="transparent" size="small" icon={<EditSettingsRegular />}>
            {t('Clientarea.Analysis.Personalization')}
          </Button>
        </PopoverTrigger>
        <PopoverSurface tabIndex={-1}>
          <div className={styles.content}>
            <Switch
              className={styles.switcher}
              checked={useClassic}
              onChange={handleUseClassicChange}
              label={t('Clientarea.Analysis.ClassicSwitcher')}
              labelPosition="after"
              size="medium"
            />
            <Switch
              className={styles.switcher}
              checked={useVersionLabel}
              onChange={handleVersionLabelChange}
              disabled={useClassic} // This feature is only available for Remastered
              label={t('Clientarea.Analysis.VersionLabelSwitcher')}
              labelPosition="after"
              size="medium"
            />
          </div>
        </PopoverSurface>
      </Popover>
    </div>
  )
}
