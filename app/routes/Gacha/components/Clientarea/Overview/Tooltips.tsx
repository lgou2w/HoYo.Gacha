import { PropsWithChildren } from 'react'
import { Body1, makeStyles, tokens } from '@fluentui/react-components'
import { InfoRegular } from '@fluentui/react-icons'
import { AccountBusiness, GenshinImpact, HonkaiStarRail, MiliastraWonderland, ZenlessZoneZero } from '@/api/Account'
import Placeholder from '@/components/Placeholder'
import { KnownI18nNs, Trans, useI18n } from '@/i18n'
import { BannerCategory, BannerStats } from '@/routes/Gacha/api/stats'
import { GachaCurrency } from '@/routes/Gacha/components/Currency'
import { useAccount } from '@/routes/Gacha/contexts/Account/hooks'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import { useGachaStats } from '@/routes/Gacha/contexts/Stats/hooks'

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

// For this component
const I18nScope = 'Clientarea.Overview.Tooltips'

export default function OverviewTooltips () {
  const styles = useStyles()

  const { dayjs } = useI18n()
  const business = useBusiness()
  const { selected } = useAccount()
  const stats = useGachaStats()

  if (!selected) {
    return null
  }

  const isMiliastraWonderland = business.toBe(MiliastraWonderland)
  const isZenlessZoneZero = business.toBe(ZenlessZoneZero)

  const now = new Date()
  const start = dayjs(stats?.startTime || now).format('LLLL')
  const end = dayjs(stats?.endTime || now).format('LLLL')

  let thirdContext: string | undefined
  if (business.toBe(GenshinImpact) || isMiliastraWonderland) {
    // Genshin Impact
    //   v4.5 (2024-03-13): 6 Months -> 1 Year
    //   https://www.miyoushe.com/ys/article/50244890
    thirdContext = 'one_year'
  } else if (business.toBe(HonkaiStarRail)) {
    // Honkai: Star Rail
    //   v4.3 (2026-06-01): 6 Months -> 1 Year, Collaboration always 2 Years
    //   https://www.miyoushe.com/sr/article/75730947
    thirdContext = 'one_year_and_collaboration'
  }

  return (
    <div className={styles.root}>
      <TooltipLine>
        {isMiliastraWonderland
          ? (
              <>
                <TooltipTotal banner={stats?.banners[BannerCategory.PermanentOde]} />
                <TooltipTotal banner={stats?.banners[BannerCategory.EventOde]} />
              </>
            )
          : <TooltipTotal total={isZenlessZoneZero ? stats?.aggregated?.total : stats?.total} />}
      </TooltipLine>
      <TooltipLine>
        <Trans
          ns={KnownI18nNs.GachaPage}
          i18nKey={`${I18nScope}.Second`}
          values={{ keyof: business.keyof, start, end }}
          components={{ time: <span className={styles.time} /> }}
        />
      </TooltipLine>
      <TooltipLine>
        <Trans
          ns={KnownI18nNs.GachaPage}
          i18nKey={`${I18nScope}.Third`}
          values={{ keyof: business.keyof }}
          context={thirdContext}
          components={{ 1: <span className={styles.danger} /> }}
        />
      </TooltipLine>
    </div>
  )
}

function TooltipLine (props: PropsWithChildren) {
  const styles = useStyles()
  return (
    <Body1 as="p" block>
      <InfoRegular className={styles.icon} />
      {props.children}
    </Body1>
  )
}

interface TooltipTotalProps {
  banner?: BannerStats<AccountBusiness> | null
  total?: number
}

function TooltipTotal (props: TooltipTotalProps) {
  const { banner, total: fallbackTotal } = props
  const styles = useStyles()

  const { t } = useI18n()
  const business = useBusiness()

  const total = fallbackTotal ?? banner?.total ?? 0
  const title = banner
    ? t(`Common:${business.keyof}.Gacha.Banner.${banner.category}`)
    : t(`Common:${business.keyof}.Gacha.Name`)

  return (
    <>
      <Trans
        ns={KnownI18nNs.GachaPage}
        i18nKey={`${I18nScope}.First`}
        values={{ title, total, value: total * 160 }}
        components={{
          1: <span className={styles.total} />,
          2: <span className={styles.currency} />,
        }}
      />
      <Placeholder />
      <GachaCurrency
        className={styles.currencyIcon}
        keyof={business.keyof}
        category={banner?.category}
        variant="01"
      />
    </>
  )
}
