import { useCallback, useState } from 'react'
import { Button, Switch, SwitchProps, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowClockwiseRegular } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'
import Updater from '@/pages/Root/components/Updater'
import { isDisabledStartupCheck, setDisableStartupCheck, useUpdaterLatestReleaseQuery } from '@/pages/Root/queries/updater'
import SectionItem from '@/pages/Settings/components/SectionItem'

export default withTrans.SettingsPage(function Updater ({ t }: WithTrans) {
  return (
    <SectionItem
      icon={<ArrowClockwiseRegular />}
      title={t('About.Updater.Title')}
      subtitle={t('About.Updater.Subtitle')}
    >
      <UpdaterAction t={t} />
    </SectionItem>
  )
})

const useActionStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
  },
})

function UpdaterAction ({ t }: Pick<WithTrans, 't'>) {
  const styles = useActionStyles()
  const { isFetching, data } = useUpdaterLatestReleaseQuery()
  const disabled = isFetching
    || data === null
    || data === 'offline'

  const [startupChecked, setStartupChecked] = useState(!isDisabledStartupCheck())
  const handleStartupCheck = useCallback<Required<SwitchProps>['onChange']>((_, data) => {
    const enabled = data.checked
    setStartupChecked(enabled)
    setDisableStartupCheck(!enabled)
  }, [])

  return (
    <div className={styles.root}>
      <Switch
        labelPosition="before"
        label={t('About.Updater.StartupCheck')}
        checked={startupChecked}
        onChange={handleStartupCheck}
        disabled={disabled}
      />
      <Updater
        trigger={(
          <Button disabled={disabled} appearance="primary">
            {t('About.Updater.CheckBtn', {
              context: isFetching
                ? 'fetching'
                : !data || data === 'offline'
                    ? 'offline'
                    : undefined,
            })}
          </Button>
        )}
      />
    </div>
  )
}
