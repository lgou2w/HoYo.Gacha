import React from 'react'
import { Body1, Button, Caption1, Tag, Title2, makeStyles, tokens } from '@fluentui/react-components'
import { BookFilled, DatabaseFilled, TopSpeedRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'

const useStyles = makeStyles({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
  },
  hero: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalL,
  },
  heroText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    maxWidth: '50%',
    rowGap: tokens.spacingVerticalL,
  },
  heroTextLogo: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    alignItems: 'baseline',
  },
  heroTextFeatures: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalL,
  },
  heroTextFeature: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
    background: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalL,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    '& svg': {
      width: '2.25rem',
      height: '2.25rem',
      padding: '0.25rem',
      color: tokens.colorBrandBackground,
      background: tokens.colorBrandBackground2Hover,
      borderRadius: tokens.borderRadiusCircular,
    },
  },
  heroVisual: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    maxWidth: '50%',
  },
  heroVisualPreview: {
    background: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
  },
  heroVisualHeader: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    alignItems: 'center',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingVerticalM}`,
    background: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    '& i': {
      display: 'block',
      width: '0.75rem',
      height: '0.75rem',
      borderRadius: tokens.borderRadiusCircular,
      background: tokens.colorBrandBackground,
    },
  },
  heroVisualHeaderBar: {
    width: '100%',
    fontSize: tokens.fontSizeBase100,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingVerticalS}`,
    background: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  heroVisualContent: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
  },
  heroVisualContentGrids: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingVerticalL,
  },
  heroVisualContentGrid: {
    padding: tokens.spacingVerticalM,
    background: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
    '& :first-child': {
      fontSize: tokens.fontSizeBase200,
    },
    '& :last-child': {
      marginTop: tokens.spacingVerticalM,
      fontSize: tokens.fontSizeBase600,
    },
  },
  heroVisualChart: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalL,
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  heroVisualChartPie: {
    position: 'relative',
    width: '8.75rem',
    height: '8.75rem',
    borderRadius: tokens.borderRadiusCircular,
    background: `conic-gradient(
      ${tokens.colorPaletteMarigoldBackground3} 0% 5%,
      ${tokens.colorPaletteBerryBackground3} 5% 17%,
      ${tokens.colorPaletteBlueBorderActive} 17% 100%
    )`,
  },
  heroVisualChartPieCenter: {
    position: 'absolute',
    width: '4.375rem',
    height: '4.375rem',
    top: '50%',
    left: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transform: 'translate(-50%, -50%)',
    fontSize: tokens.fontSizeBase200,
    background: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusCircular,
  },
  heroVisualChartLegend: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
  },
  heroVisualChartLegendItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: tokens.fontSizeBase300,
    flex: 1,
    '& :first-child': {
      display: 'block',
      width: '0.75rem',
      height: '0.75rem',
      marginRight: tokens.spacingHorizontalS,
      borderRadius: tokens.borderRadiusSmall,
    },
    '&[data-rank="5"] :first-child': { background: tokens.colorPaletteMarigoldBackground3 },
    '&[data-rank="4"] :first-child': { background: tokens.colorPaletteBerryBackground3 },
    '&[data-rank="3"] :first-child': { background: tokens.colorPaletteBlueBorderActive },
    '& :last-child': {
      marginLeft: 'auto',
    },
  },
  footer: {
    maxWidth: '65%',
    margin: '1rem auto 0',
    padding: '0.5rem 0.75rem',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackground1,
  },
})

export default function Home () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.heroTextLogo}>
            <Title2 as="h2">{__APP_NAME__}</Title2>
            <Locale component={Tag} appearance="brand" mapping={['Pages.Home.Hero.Tag']} />
          </div>
          <Locale component={Title2} as="h1" block mapping={['Pages.Home.Hero.Title']} />
          <Locale component={Body1} mapping={['Pages.Home.Hero.Subtitle']} />
          <div className={styles.heroTextFeatures}>
            <div className={styles.heroTextFeature}>
              <TopSpeedRegular />
              <Locale component="h3" mapping={['Pages.Home.Hero.Feature1.Title']} />
              <Locale component="p" mapping={['Pages.Home.Hero.Feature1.Subtitle']} />
            </div>
            <div className={styles.heroTextFeature}>
              <DatabaseFilled />
              <Locale component="h3" mapping={['Pages.Home.Hero.Feature2.Title']} />
              <Locale component="p" mapping={['Pages.Home.Hero.Feature2.Subtitle']} />
            </div>
          </div>
          <div>
            <Button
              as="a"
              size="large"
              appearance="primary"
              icon={<BookFilled />}
              href={__APP_HOMEPAGE__}
              target="_blank"
            >
              <Locale mapping={['Pages.Home.Hero.TutorialBtn']} />
            </Button>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroVisualPreview}>
            <div className={styles.heroVisualHeader}>
              <i />
              <div className={styles.heroVisualHeaderBar}>
                {__APP_NAME__}://Clientarea
              </div>
            </div>
            <div className={styles.heroVisualContent}>
              <div className={styles.heroVisualContentGrids}>
                {[1248, 9, 73, 63].map((value, index) => (
                  <div key={index} className={styles.heroVisualContentGrid}>
                    <Locale component="div" mapping={[`Pages.Home.Hero.Visual.Grid${index + 1}.Title`]} />
                    <Locale component="div" mapping={[`Pages.Home.Hero.Visual.Grid${index + 1}.Subtitle`, { count: value }]} />
                  </div>
                ))}
              </div>
              <div className={styles.heroVisualChart}>
                <div className={styles.heroVisualChartPie}>
                  <Locale
                    component="div"
                    className={styles.heroVisualChartPieCenter}
                    mapping={['Pages.Home.Hero.Visual.PieCenter']}
                  />
                </div>
                <div className={styles.heroVisualChartLegend}>
                  {[[5, 5], [4, 12], [3, 83]].map(([rank, percentage], index) => (
                    <div key={index} className={styles.heroVisualChartLegendItem} data-rank={rank}>
                      <i />
                      <Locale mapping={[`Pages.Home.Hero.Visual.Legend${rank}`]} />
                      <div>{percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <Locale component={Caption1} mapping={['Pages.Home.Footer']} />
      </div>
    </div>
  )
}
