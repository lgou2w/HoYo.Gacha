import { Badge, Body2, Subtitle1, Title3, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowSwapFilled, DatabaseFilled, GamesFilled, HistoryFilled, PeopleFilled, ShieldFilled } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    rowGap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalL,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
  },
  title: {},
  subtitle: {
    color: tokens.colorNeutralForeground2,
  },
  features: {
    display: 'flex',
    flexDirection: 'row',
    flex: '1 0 auto',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalL,
  },
  feature: {
    display: 'inline-flex',
    flexDirection: 'column',
    flex: `1 0 calc(33% - ${tokens.spacingVerticalL})`,
    minWidth: `calc(24rem - ${tokens.spacingVerticalL})`,
    rowGap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalL,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadius2XLarge,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
    transition: `transform ${tokens.durationNormal}, box-shadow ${tokens.durationNormal}`,
    ':hover': {
      transform: 'translateY(-0.25rem)',
      boxShadow: tokens.shadow4,
    },
  },
  featureTitle: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS,
    '> svg': {
      color: tokens.colorBrandForeground1,
      width: tokens.fontSizeHero800,
      height: 'auto',
    },
  },
  featureSubtitle: {
    color: tokens.colorNeutralForeground2,
  },
  featureTags: {
    display: 'inline-flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
})

const AvailableFeatures = [
  { key: 'MultiGame', icon: <GamesFilled /> },
  { key: 'MultiAccount', icon: <PeopleFilled /> },
  { key: 'NoProxy', icon: <ShieldFilled /> },
  { key: 'Analysis', icon: <HistoryFilled /> },
  { key: 'Database', icon: <DatabaseFilled /> },
  { key: 'Converters', icon: <ArrowSwapFilled /> },
]

export default withTrans.HomePage(function Features ({ t }: WithTrans) {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Title3 className={styles.title} as="h2" align="center" block>
          {t('Feature.Title')}
        </Title3>
        <Body2 className={styles.subtitle} as="p" align="center" block>
          {t('Feature.Subtitle')}
        </Body2>
      </div>
      <div className={styles.features}>
        {AvailableFeatures.map((feature) => (
          <div className={styles.feature} key={feature.key}>
            <Subtitle1 className={styles.featureTitle} as="h3" block>
              {feature.icon}
              {t(`Feature.${feature.key}.Title`)}
            </Subtitle1>
            <Body2 className={styles.featureSubtitle} as="h4" block>
              {t(`Feature.${feature.key}.Subtitle`)}
            </Body2>
            <div className={styles.featureTags}>
              {(t(`Feature.${feature.key}.Tags`, { returnObjects: true }) as string[]).map((tag, index) => (
                <Badge key={index} size="large" appearance="tint">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
