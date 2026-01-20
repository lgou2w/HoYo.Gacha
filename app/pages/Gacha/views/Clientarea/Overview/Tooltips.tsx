import { Body1, Image, makeStyles, tokens } from '@fluentui/react-components'
import { InfoRegular } from '@fluentui/react-icons'
import { AccountBusiness, MiliastraWonderland, ZenlessZoneZero } from '@/api/schemas/Account'
import Placeholder from '@/components/Placeholder'
import { Trans, WithTransKnownNs, useI18n } from '@/i18n'
import { currencySrc } from '@/pages/Gacha/components/Ticket'
import { BusinessState } from '@/pages/Gacha/contexts/Business'
import { CategorizedRecords, PrettizedCategory, usePrettizedRecords } from '@/pages/Gacha/contexts/PrettizedRecords'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  icon: {
    fontSize: tokens.fontSizeBase300,
    marginRight: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalXXS,
    verticalAlign: 'middle',
  },
  total: {
    color: tokens.colorBrandForeground1,
    fontFamily: tokens.fontFamilyNumeric,
  },
  currency: {
    color: tokens.colorPaletteMarigoldForeground1,
    fontFamily: tokens.fontFamilyNumeric,
  },
  currencyIcon: {
    width: 'auto',
    height: tokens.lineHeightBase300,
    verticalAlign: 'text-top',
  },
  time: {
    color: tokens.colorPaletteGreenForeground1,
    fontFamily: tokens.fontFamilyNumeric,
  },
  danger: {
    color: tokens.colorStatusDangerForeground1,
    fontFamily: tokens.fontFamilyNumeric,
  },
})

export default function OverviewTooltips () {
  const styles = useStyles()
  const { business, selectedAccount, data } = usePrettizedRecords()
  const isMiliastraWonderland = business.toBe(MiliastraWonderland)
  const isZenlessZoneZero = business.toBe(ZenlessZoneZero)
  const i18n = useI18n()

  if (!selectedAccount) {
    return null
  }

  const now = new Date()
  const start = i18n.dayjs(data?.startTime || now).format('LLLL')
  const end = i18n.dayjs(data?.endTime || now).format('LLLL')

  return (
    <div className={styles.root}>
      <Body1 as="p" block>
        <InfoRegular className={styles.icon} />
        {isMiliastraWonderland
          ? [
              <TooltipTotal
                key={PrettizedCategory.PermanentOde}
                business={business}
                categorized={data?.categorizeds?.PermanentOde}
                styles={styles}
                i18n={i18n}
              />,
              <TooltipTotal
                key={PrettizedCategory.EventOde}
                business={business}
                categorized={data?.categorizeds?.EventOde}
                styles={styles}
                i18n={i18n}
              />,
            ]
          : (
              <TooltipTotal
                business={business}
                total={isZenlessZoneZero ? data?.aggregated.total : data?.total}
                styles={styles}
                i18n={i18n}
              />
            )}
      </Body1>
      <Body1 as="p" block>
        <InfoRegular className={styles.icon} />
        <Trans
          ns={WithTransKnownNs.GachaPage}
          i18nKey="Clientarea.Overview.Tooltips.Second"
          values={{ keyof: business.keyof, start, end }}
          components={{
            time: <span className={styles.time} />,
          }}
        />
      </Body1>
      <Body1 as="p" block>
        <InfoRegular className={styles.icon} />
        <Trans
          ns={WithTransKnownNs.GachaPage}
          i18nKey="Clientarea.Overview.Tooltips.Third"
          values={{ keyof: business.keyof }}
          context={isMiliastraWonderland ? 'one_year' : undefined}
          components={{
            1: <span className={styles.danger} />,
          }}
        />
      </Body1>
    </div>
  )
}

function TooltipTotal ({
  styles,
  i18n,
  business,
  categorized,
  total: pTotal,
}: {
  styles: ReturnType<typeof useStyles>
  i18n: ReturnType<typeof useI18n>
  business: BusinessState
  categorized?: CategorizedRecords<AccountBusiness> | null
  total?: number
}) {
  const total = pTotal || categorized?.total || 0
  const title = categorized
    ? i18n.t(`${business.keyof}.Gacha.Category.${categorized.category}`)
    : i18n.t(`${business.keyof}.Gacha.Name`)

  return [
    <Trans
      key={(categorized?.category || business.keyof) + '-trans'}
      ns={WithTransKnownNs.GachaPage}
      i18nKey="Clientarea.Overview.Tooltips.First"
      values={{ title, total, value: total * 160 }}
      components={{
        1: <span className={styles.total} />,
        2: <span className={styles.currency} />,
      }}
    />,
    <Placeholder key={(categorized?.category || business.keyof) + '-placeholder'} />,
    <Image
      key={(categorized?.category || business.keyof) + '-currency'}
      src={currencySrc(business.keyof, categorized?.category, '01')}
      className={styles.currencyIcon}
    />,
  ]
}
