import { Badge, Body2, Button, Title1, makeStyles, tokens } from '@fluentui/react-components'
import { BookFilled } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalL,
    padding: tokens.spacingVerticalL,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    boxShadow: tokens.shadow2,
  },
  header: {
    display: 'inline-flex',
    flexDirection: 'column',
    flex: '1 1 auto',
    rowGap: tokens.spacingVerticalM,
  },
  titleWrapper: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalL,
  },
  title: {
    background: `linear-gradient(to right, ${tokens.colorBrandForeground2Pressed} 0%, ${tokens.colorBrandForeground1} 80%)`,
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
  },
  actions: {
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: tokens.spacingHorizontalL,
  },
})

export default withTrans.HomePage(function Hero ({ t }: WithTrans) {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <Title1 className={styles.title} as="h1" block>
            {t('Hero.Title')}
          </Title1>
          <Badge
            appearance="tint"
            size="large"
            shape="rounded"
          >
            {t('Hero.TitleBadge')}
          </Badge>
        </div>
        <Body2 className={styles.subtitle} as="p" block>
          {t('Hero.Subtitle')}
        </Body2>
      </div>
      <div className={styles.actions}>
        <Button
          as="a"
          size="large"
          shape="circular"
          appearance="primary"
          icon={<BookFilled />}
          href={__APP_HOMEPAGE__}
          target="_blank"
          rel="noreferrer"
        >
          {t('Hero.UserGuide')}
        </Button>
      </div>
    </div>
  )
})
