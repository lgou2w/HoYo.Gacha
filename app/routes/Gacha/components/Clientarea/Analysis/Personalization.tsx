import { ChangeEventHandler, Suspense, useCallback } from 'react'
import { Skeleton, SkeletonItem, Switch, makeStyles, switchClassNames, tokens } from '@fluentui/react-components'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useClassicMutation, useClassicSuspenseQuery, useVersionLabelMutation, useVersionLabelSuspenseQuery } from './hooks'

const useStyles = makeStyles({
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
})

export default function AnalysisPersonalization () {
  const styles = useStyles()

  return (
    <Suspense fallback={(
      <Skeleton className={styles.skeleton} aria-label="Loading Content">
        <SkeletonItem size={24} />
        <SkeletonItem size={24} />
      </Skeleton>
    )}
    >
      <ClassicSwitcher />
      <VersionLabelSwitcher />
    </Suspense>
  )
}

const useSwitcherStyles = makeStyles({
  root: {
    [`& .${switchClassNames.indicator}`]: {
      margin: 0,
    },
    [`& .${switchClassNames.label}`]: {
      padding: 0,
      paddingLeft: tokens.spacingHorizontalS,
    },
  },
})

function ClassicSwitcher () {
  const styles = useSwitcherStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })

  const { data: useClassic } = useClassicSuspenseQuery()
  const { mutate: setUseClassic } = useClassicMutation()
  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((evt) => {
    setUseClassic(evt.currentTarget.checked)
  }, [setUseClassic])

  return (
    <Switch
      className={styles.root}
      checked={useClassic}
      onChange={handleChange}
      label={t('Clientarea.Personalization.Analysis.ClassicSwitcher')}
      labelPosition="after"
      size="medium"
    />
  )
}

function VersionLabelSwitcher () {
  const styles = useSwitcherStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })

  const { data: useClassic } = useClassicSuspenseQuery()
  const { data: versionLabel } = useVersionLabelSuspenseQuery()
  const { mutate: setVersionLabel } = useVersionLabelMutation()
  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((evt) => {
    setVersionLabel(evt.currentTarget.checked)
  }, [setVersionLabel])

  return (
    <Switch
      className={styles.root}
      disabled={useClassic} // This feature is only available for Remastered
      checked={versionLabel}
      onChange={handleChange}
      label={t('Clientarea.Personalization.Analysis.VersionLabelSwitcher')}
      labelPosition="after"
      size="medium"
    />
  )
}
