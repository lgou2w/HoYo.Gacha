import { ChangeEventHandler, useCallback } from 'react'
import { Label, Switch, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowSortDownLinesRegular, ArrowSortRegular, ArrowSortUpLinesRegular } from '@fluentui/react-icons'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useRecordsOrderMutation, useRecordsOrderSuspenseQuery } from './hooks'
import { RecordsOrder } from './types'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flexShrink: 0,
    alignItems: 'center',
  },
  label: {
    marginLeft: tokens.spacingHorizontalXS,
  },
})

/**
 * Toggle the Histories record order.
 *
 * Off (default) = oldest-first — matches the backend's `ORDER BY id ASC`
 * and needs no copy. On = newest-first, which reverses a shallow copy of
 * the cached array (see `sortRecords`).
 *
 * The label shows the current state rather than the target state — with a
 * two-state toggle the Switch position already conveys "on/off", so
 * echoing the value in the label removes the need for a separate
 * descriptive text.
 */
export default function RecordsOrderSwitch () {
  const styles = useStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Clientarea.Analysis.Classic.RecordOrder' })
  const { data: order } = useRecordsOrderSuspenseQuery()
  const { mutate: setOrder } = useRecordsOrderMutation()
  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>((evt) => {
    setOrder(evt.currentTarget.checked
      ? RecordsOrder.NewestFirst
      : RecordsOrder.OldestFirst,
    )
  }, [setOrder])

  const isNewestFirst = order === RecordsOrder.NewestFirst

  return (
    <div className={styles.root}>
      <ArrowSortRegular />
      <Label className={styles.label} size="small">
        {t('Label')}
      </Label>
      <Switch
        checked={isNewestFirst}
        onChange={handleChange}
        label={t(order)}
        size="small"
      />
      {isNewestFirst ? <ArrowSortUpLinesRegular /> : <ArrowSortDownLinesRegular />}
    </div>
  )
}
