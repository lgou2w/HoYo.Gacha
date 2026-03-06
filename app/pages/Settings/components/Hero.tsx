import { Button, Caption1, Caption1Strong, Image, makeStyles, tokens } from '@fluentui/react-components'
import { ChatBubblesQuestionFilled, HomeFilled, MailFilled } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'flex-start',
    width: '100%',
    minWidth: '16rem',
    rowGap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    margin: `${tokens.spacingVerticalL} auto 0`,
    userSelect: 'none',
    pointerEvents: 'none',
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalS,
    justifyContent: 'center',
  },
  copyright: {
  },
  copyrightLicense: {
    color: tokens.colorNeutralForeground3,
  },
})

export default function Hero () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <div className={styles.brand}>
        <Image src="/Logo.avif" />
        <Caption1Strong align="center">
          {__APP_NAME__}
        </Caption1Strong>
        <Caption1 align="center">
          v
          {__APP_VERSION__}
        </Caption1>
      </div>
      <div className={styles.actions}>
        <Button
          as="a"
          target="_blank"
          rel="noreferrer"
          href={__APP_HOMEPAGE__}
          icon={<HomeFilled />}
          appearance="subtle"
          shape="circular"
        />
        <Button
          as="a"
          target="_blank"
          rel="noreferrer"
          href={__APP_ISSUES__}
          icon={<ChatBubblesQuestionFilled />}
          appearance="subtle"
          shape="circular"
        />
        <Button
          as="a"
          target="_blank"
          rel="noreferrer"
          href={`mailto:${__APP_AUTHOR__}`}
          icon={<MailFilled />}
          appearance="subtle"
          shape="circular"
        />
      </div>
      <div className={styles.copyright}>
        <Caption1 as="p" align="center" block>
          License MIT OR Apache-2.0
        </Caption1>
        <Caption1 as="p" align="center" block>
          Copyright &copy; 2022 - Present The lgou2w
        </Caption1>
        <br />
        <License className={styles.copyrightLicense} />
      </div>
    </div>
  )
}

const License = withTrans.SettingsPage(function License (
  { t, className }: WithTrans & { className?: string },
) {
  return (
    <Caption1 className={className} as="p" align="center" block>
      {t('Hero.License')}
    </Caption1>
  )
})
