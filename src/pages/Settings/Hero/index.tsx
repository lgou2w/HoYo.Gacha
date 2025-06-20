import React from 'react'
import { Button, Caption1, Caption1Strong, Caption2, Image, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { ChatBubblesQuestionFilled, HomeFilled } from '@fluentui/react-icons'
import Locale from '@/components/Locale'

const useStyles = makeStyles({
  root: { alignSelf: 'flex-start' },
  hero: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    boxShadow: tokens.shadow2,
    borderRadius: tokens.borderRadiusMedium,
    background: tokens.colorNeutralBackground1,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    userSelect: 'none',
    pointerEvents: 'none',
    margin: `${tokens.spacingVerticalL} auto`,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  copyright: {
    display: 'flex',
  },
})

export default function SettingsHero (props: React.JSX.IntrinsicElements['div']) {
  const styles = useStyles()
  const { className, ...rest } = props

  return (
    <div className={mergeClasses(styles.root, className)} {...rest}>
      <div className={styles.hero}>
        <div className={styles.brand}>
          <Image src="/Logo.webp" />
          <Caption1Strong align="center">{__APP_NAME__}</Caption1Strong>
          <Caption2 align="center">v{__APP_VERSION__}</Caption2>
        </div>
        <div className={styles.actions}>
          <Button
            as="a"
            appearance="transparent"
            icon={<HomeFilled />}
            href={__APP_HOMEPAGE__}
            target="_blank"
          >
            <Locale mapping={['Pages.Settings.Hero.OfficialBtn']} />
          </Button>
          <Button
            as="a"
            appearance="transparent"
            icon={<ChatBubblesQuestionFilled />}
            href={__APP_ISSUES__}
            target="_blank"
          >
            <Locale mapping={['Pages.Settings.Hero.FeedbackBtn']} />
          </Button>
        </div>
        <div className={styles.copyright}>
          <Caption1>
            {'License MIT OR Apache-2.0'}
            <br/>
            {'Copyright \u00A9 2022 - Present The lgou2w'}
            <br/>
            <Locale mapping={['Pages.Settings.Hero.LicenseNote']} />
          </Caption1>
        </div>
      </div>
    </div>
  )
}
