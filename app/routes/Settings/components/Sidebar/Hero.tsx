import { Button, Caption1, Caption1Strong, Image, Slot, makeStyles, tokens } from '@fluentui/react-components'
import { ChatBubblesQuestionFilled, HomeFilled, MailFilled } from '@fluentui/react-icons'
import { KnownI18nNs, useI18n } from '@/i18n'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    minWidth: '16rem',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
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
    justifyContent: 'center',
    columnGap: tokens.spacingHorizontalS,
  },
  secondary: {
    color: tokens.colorNeutralForeground3,
  },
})

export default function Hero () {
  const styles = useStyles()
  const { t } = useI18n({ ns: KnownI18nNs.SettingsPage })

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        <div className={styles.brand}>
          <Image src="/Logo.avif" alt="logo" />
          <Caption1Strong align="center">{__APP_NAME__}</Caption1Strong>
          <Caption1 align="center">{`v${__APP_VERSION__}`}</Caption1>
        </div>
        <div className={styles.actions}>
          <Action icon={<HomeFilled />} href={__APP_HOMEPAGE__} />
          <Action icon={<ChatBubblesQuestionFilled />} href={__APP_ISSUES__} />
          <Action icon={<MailFilled />} href={`mailto:${__APP_AUTHOR__}`} />
        </div>
        <div>
          <Caption1 as="p" align="center" block>
            License MIT OR Apache-2.0
          </Caption1>
          <Caption1 as="p" align="center" block>
            Copyright &copy; 2022 - Present The lgou2w
          </Caption1>
          <br />
          <Caption1 className={styles.secondary} as="p" align="center" block>
            {t('Sidebar.Hero.License')}
          </Caption1>
        </div>
      </div>
      <div className={styles.wrapper}>
        <Caption1 className={styles.secondary} as="p" align="center" block>
          {t('Sidebar.Hero.Copyright')}
        </Caption1>
      </div>
    </div>
  )
}

interface ActionProps {
  icon: Slot<'span'>
  href: string
}

function Action (props: ActionProps) {
  const { icon, href } = props
  return (
    <Button
      as="a"
      target="_blank"
      rel="noreferrer"
      appearance="subtle"
      shape="circular"
      icon={icon}
      href={href}
    />
  )
}
