import React from 'react'
import { Button, Caption1, Caption1Strong, Caption2, Image, buttonClassNames, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components'
import { ChatBubblesQuestionFilled, HomeFilled } from '@fluentui/react-icons'
import Locale from '@/components/UI/Locale'

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
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM)
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    userSelect: 'none',
    pointerEvents: 'none',
    ...shorthands.margin(tokens.spacingVerticalL, 'auto')
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    [`& .${buttonClassNames.icon}`]: {
      fontSize: tokens.fontSizeBase500,
      width: tokens.fontSizeBase500,
      height: tokens.fontSizeBase500
    }
  },
  copyright: {
    display: 'flex'
  }
})

export default function SettingsHero (props: React.JSX.IntrinsicElements['div']) {
  const { className, ...rest } = props
  const classes = useStyles()
  return (
    <div className={mergeClasses(classes.root, className)} {...rest}>
      <div className={classes.hero}>
        <div className={classes.brand}>
          <Image src="/Logo.png" />
          <Caption1Strong align="center">{__APP_NAME__}</Caption1Strong>
          <Caption2 align="center">v{__APP_VERSION__}</Caption2>
        </div>
        <div className={classes.actions}>
          <Button
            appearance="transparent"
            icon={<HomeFilled />}
            as="a"
            href="https://hoyo-gacha.lgou2w.com"
            target="_blank"
          >
            <Locale mapping={['Pages.Settings.Hero.OfficialBtn']} />
          </Button>
          <Button
            appearance="transparent"
            icon={<ChatBubblesQuestionFilled />}
            as="a"
            href="https://github.com/lgou2w/HoYo.Gacha/issues"
            target="_blank"
          ><Locale mapping={['Pages.Settings.Hero.FeedbackBtn']} /></Button>
        </div>
        <div className={classes.copyright}>
          <Caption1>
            License MIT OR Apache-2.0
            <br/>
            Copyright &copy; 2022 - Present The lgou2w
            <br/>
            <Locale mapping={['Pages.Settings.Hero.LicenseNote']} />
          </Caption1>
        </div>
      </div>
    </div>
  )
}
