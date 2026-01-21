import React, { Fragment } from 'react'
import { Caption1, makeStyles, tokens } from '@fluentui/react-components'
import BizImages from '@/components/BizImages'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { Business, KeyofBusinesses, ZenlessZoneZero, isMiliastraWonderland } from '@/interfaces/Business'
import { CategorizedMetadata, PrettyCategory } from '@/interfaces/GachaRecord'
import { CompositeState } from '@/pages/Gacha/LegacyView/Clientarea/useCompositeState'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalSNudge,
  },
  total: {
    color: tokens.colorBrandForeground1,
  },
  currency: {
    color: tokens.colorPaletteMarigoldForeground1,
  },
  currencyIcon: {
    width: 'auto',
    height: tokens.lineHeightBase200,
    verticalAlign: 'text-top',
  },
  secondary: {
    color: tokens.colorPaletteGreenForeground1,
  },
})

export default function GachaLegacyViewClientareaOverviewTooltips (props: CompositeState) {
  const styles = useStyles()
  const {
    business,
    keyofBusinesses,
    prettized: {
      total, startTime, endTime,
      categorizeds: {
        PermanentOde,
        EventOde,
      },
      aggregated,
    },
  } = props

  const isBeyond = isMiliastraWonderland(keyofBusinesses)
  const isZenlessZoneZero = business === ZenlessZoneZero
  const i18n = useI18n()
  const now = new Date()

  return (
    <div className={styles.root}>
      <Caption1>
        {'\u2756\u00A0'}
        {isBeyond
          ? [
              aggregate({ styles, keyofBusinesses, value: PermanentOde! }),
              aggregate({ styles, keyofBusinesses, value: EventOde! }),
            ]
          : aggregate({
            styles,
            keyofBusinesses,
            value: isZenlessZoneZero
              ? aggregated?.total ?? 0
              : total,
          })
        }
      </Caption1>
      <Caption1>
        {'\u2756\u00A0'}
        <Locale mapping={['Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.Fragment2', { keyofBusinesses }]} />
        <span className={styles.secondary}>{i18n.dayjs(startTime || now).format('LLLL')}</span>
        {'\u00A0\u007E\u00A0'}
        <span className={styles.secondary}>{i18n.dayjs(endTime || now).format('LLLL')}</span>
      </Caption1>
      <Caption1>
        {'\u2756\u00A0'}
        <Locale mapping={[
          'Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.Fragment3',
          { keyofBusinesses, context: isBeyond ? 'One_Year' : undefined },
        ]} />
      </Caption1>
    </div>
  )
}

function aggregate ({
  styles,
  keyofBusinesses,
  value,
}: {
  styles: ReturnType<typeof useStyles>
  keyofBusinesses: KeyofBusinesses
  value: number | CategorizedMetadata<Business>
}) {
  const isBeyond = isMiliastraWonderland(keyofBusinesses)
  const fragment = isBeyond ? 'Fragment1Beyond' : 'Fragment1'
  const [category, total] = typeof value === 'object'
    ? [value.category, value.total]
    : [null, value]

  let currencyIcon = 'IconCurrency01'
  if (isBeyond) {
    switch (category) {
      case PrettyCategory.PermanentOde:
        currencyIcon = 'IconGachaTicket01'
        break
      case PrettyCategory.EventOde:
        currencyIcon = 'IconGachaTicket02'
        break
    }
  }

  return (
    <Fragment key={category}>
      {category === PrettyCategory.PermanentOde && (
        <Locale mapping={[`Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.${fragment}.FragmentStart`]} />
      )}
      <Locale mapping={[
        `Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.${fragment}.Token1`,
        { keyofBusinesses, category },
      ]} />
      <Locale
        component="span"
        className={styles.total}
        mapping={[`Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.${fragment}.Token2`, { total }]}
      />
      <Locale mapping={[`Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.${fragment}.Token3`]} />
      <Locale
        component="span"
        className={styles.currency}
        mapping={[`Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.${fragment}.Token4`, { value: total * 160 }]}
      />
      <img className={styles.currencyIcon} src={BizImages[keyofBusinesses].Material![currencyIcon]} />
      {category === PrettyCategory.PermanentOde && (
        <Locale mapping={[`Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.${fragment}.FragmentSeparator`]} />
      )}
    </Fragment>
  )
}
