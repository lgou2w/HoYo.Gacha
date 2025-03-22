import React from 'react'
import { Caption1, makeStyles, tokens } from '@fluentui/react-components'
import BizImages from '@/components/BizImages'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { ParentCompositeState } from './declares'

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

export default function GachaLegacyViewClientareaOverviewTooltips (props: ParentCompositeState) {
  const styles = useStyles()
  const {
    keyofBusinesses,
    prettized: {
      total,
      startTime,
      endTime,
    },
  } = props

  const i18n = useI18n()

  return (
    <div className={styles.root}>
      <Caption1>
        &#x2756;&nbsp;
        <Locale mapping={['Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.Fragment1.Token1', { keyofBusinesses }]} />
        <Locale
          component="span"
          className={styles.total}
          mapping={['Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.Fragment1.Token2', { total }]}
        />
        <Locale mapping={['Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.Fragment1.Token3']} />
        <Locale
          component="span"
          className={styles.currency}
          mapping={['Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.Fragment1.Token4', { value: total * 160 }]}
        />
        <img className={styles.currencyIcon} src={BizImages[keyofBusinesses].Material!.IconCurrency01} />
      </Caption1>
      <Caption1>
        &#x2756;&nbsp;
        <Locale mapping={['Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.Fragment2', { keyofBusinesses }]} />
        <span className={styles.secondary}>{i18n.dayjs(startTime).format('LLLL')}</span>
        &nbsp;&#x7E;&nbsp;
        <span className={styles.secondary}>{i18n.dayjs(endTime).format('LLLL')}</span>
      </Caption1>
      <Caption1>
        &#x2756;&nbsp;
        <Locale mapping={['Pages.Gacha.LegacyView.Clientarea.Overview.Tooltips.Fragment3']} />
      </Caption1>
    </div>
  )
}
