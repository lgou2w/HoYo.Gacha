import { MouseEventHandler, PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { Body1, Body1Strong, Body2, Button, Caption1, Link, Title3, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { AlertUrgentRegular, ArrowClockwiseRegular, BugRegular, HomeRegular, InfoRegular, MailRegular } from '@fluentui/react-icons'
import { CatchBoundary, ErrorComponentProps, ErrorRouteComponent, createLink, useRouter } from '@tanstack/react-router'
import { open } from '@tauri-apps/plugin-shell'
import { Environment, deviceSpec } from '@/api/commands/app'
import CopyButton from '@/components/CopyButton'
import { useEnvironment } from '@/contexts/Environment'
import { Language, WithTrans, isChinese, withTrans } from '@/i18n'

export default function ErrorBoundary (props: PropsWithChildren) {
  const [token, setToken] = useState(0)
  const router = useRouter()

  // HACK: This effect ensures the error boundary resets on route changes by updating a token
  // that's used as the reset key for CatchBoundary. This forces the error boundary to clear
  // any caught errors when the user navigates to a new route, allowing the new route's
  // components to render fresh without error state interference.
  // The token update does NOT cause child components to re-mount or re-render unnecessarily;
  // it only resets the error boundary's internal error state.
  // See:
  //   https://tanstack.com/router/latest/docs/framework/react/api/router/catchBoundaryComponent
  //   https://github.com/TanStack/router/blob/main/packages/react-router/src/CatchBoundary.tsx
  useEffect(() => {
    return router.subscribe('onBeforeNavigate', (event) => {
      if (event.pathChanged) {
        setToken((n) => {
          if (import.meta.env.DEV) {
            console.debug('ErrorBoundary reset due to path change', n)
          }

          return n + 1
        })
      }
    })
  }, [router])

  return (
    <CatchBoundary
      errorComponent={ErrorComponent}
      getResetKey={() => `ErrorBoundary-Token-${token}`}
    >
      {props.children}
    </CatchBoundary>
  )
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: 'inherit',
    height: 'inherit',
    maxWidth: '90%',
    rowGap: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `calc(${tokens.fontSizeHero900} * 1.2)`,
    height: `calc(${tokens.fontSizeHero900} * 1.2)`,
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorStatusDangerBackground2,
    color: tokens.colorStatusDangerForeground1,
  },
  icon: {
    fontSize: tokens.fontSizeHero800,
  },
  sectionWrapper: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
  },
  sectionHeader: {
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: tokens.fontWeightBold,
    '> svg': {
      fontSize: tokens.fontSizeBase500,
      marginRight: tokens.spacingHorizontalXS,
    },
  },
  sectionContent: {
    padding: tokens.spacingVerticalM,
    color: tokens.colorStatusDangerForeground1,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    borderRadius: tokens.borderRadiusMedium,
  },
  stackCopy: {
    marginLeft: 'auto',
  },
  stack: {
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    fontFamily: tokens.fontFamilyMonospace,
  },
  feedbackWrapper: {
    rowGap: tokens.spacingVerticalL,
    borderLeft: `4px solid ${tokens.colorBrandBackground}`,
  },
  feedbackSections: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalL,
  },
  feedbackSection: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackgroundAlpha,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
  },
  feedbackTooltip: {
    color: tokens.colorNeutralForeground2,
    fontStyle: 'italic',
  },
  actionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  actions: {
    display: 'inline-flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalM,
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
  },
})

const ButtonLink = createLink(Button)

enum Feedback {
  GitHub = 'GitHub',
  Email = 'Email',
}

const ErrorComponent = withTrans.RootPage((
  { i18n, t, error, reset }: WithTrans & ErrorComponentProps,
) => {
  const styles = useStyles()
  const environment = useEnvironment()

  function tE (subKey: string, options?: Parameters<typeof t>[2]) {
    return t(`ErrorBoundary.${subKey}`, options)
  }

  const handleFeedback = useCallback<MouseEventHandler>((evt) => {
    const option = evt.currentTarget.getAttribute('data-option') as Feedback | undefined
    if (!option) {
      return
    }

    const title = t('ErrorBoundary.Feedback.Report.Title', {
      app: __APP_NAME__,
      message: error.message,
    })

    const deviceSpec = combineDeviceSpec(environment)
    const stackTrace = error.stack || error.message

    ;(option === Feedback.GitHub
      ? openWithGitHubIssue
      : openWithMailto
    )(i18n.language, title, deviceSpec, stackTrace)
  }, [environment, error.message, error.stack, i18n.language, t])

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <AlertUrgentRegular className={styles.icon} />
          </div>
          <Title3 as="h2" block>{tE('Title')}</Title3>
          <Body2 as="h3" block>{tE('Subtitle')}</Body2>
        </div>
        <div className={styles.sectionWrapper}>
          <Body2 className={styles.sectionHeader} as="h4" block>
            <InfoRegular />
            {tE('Message.Title')}
          </Body2>
          <Body1 className={styles.sectionContent} as="p">
            {error.message}
          </Body1>
        </div>
        <div className={styles.sectionWrapper}>
          <Body2 className={styles.sectionHeader} as="h4" block>
            <BugRegular />
            {tE('Stack.Title')}
            <CopyButton
              className={styles.stackCopy}
              content={error.stack}
              appearance="transparent"
              size="small"
            >
              {(copied) => copied
                ? tE('Stack.Copied')
                : tE('Stack.Copy')}
            </CopyButton>
          </Body2>
          <Body1
            className={mergeClasses(styles.sectionContent, styles.stack)}
            as="pre"
          >
            {error.stack}
          </Body1>
        </div>
        <div className={mergeClasses(styles.sectionWrapper, styles.feedbackWrapper)}>
          <Body2 className={styles.sectionHeader}>
            {tE('Feedback.Title')}
          </Body2>
          <Body1>
            {tE('Feedback.Subtitle')}
          </Body1>
          <div className={styles.feedbackSections}>
            {([
              { option: Feedback.GitHub, icon: <BugRegular />, appearance: 'primary' },
              { option: Feedback.Email, icon: <MailRegular />, appearance: 'secondary' },
            ] as const).map(({ option, icon, appearance }) => (
              <div className={styles.feedbackSection} key={option}>
                <Body1Strong>
                  {tE(`Feedback.${option}.Title`)}
                </Body1Strong>
                <Body1>
                  {tE(`Feedback.${option}.Subtitle`)}
                </Body1>
                <div>
                  <Button
                    data-option={option}
                    onClick={handleFeedback}
                    icon={icon}
                    appearance={appearance}
                  >
                    {tE(`Feedback.${option}.Button`)}
                  </Button>
                </div>
                <Caption1 className={styles.feedbackTooltip}>
                  {tE(`Feedback.${option}.Tooltip`)}
                </Caption1>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.actionsWrapper}>
          <Body1>
            {tE('Actions.Title')}
          </Body1>
          <div className={styles.actions}>
            <Button
              onClick={reset}
              icon={<ArrowClockwiseRegular />}
              appearance="primary"
            >
              {tE('Actions.Reset')}
            </Button>
            <ButtonLink
              as="a"
              to="/"
              icon={<HomeRegular />}
              appearance="secondary"
            >
              {tE('Actions.Home')}
            </ButtonLink>
          </div>
        </div>
        <div className={styles.footer}>
          <Body1>
            {tE('Footer.Title')}
            <Link href={__APP_ISSUES__} target="_blank">
              {tE('Footer.Faq')}
            </Link>
            {' · '}
            <Link href={__APP_HOMEPAGE__} target="_blank">
              {tE('Footer.Official')}
            </Link>
          </Body1>
        </div>
      </div>
    </div>
  )
}) as ErrorRouteComponent

function combineDeviceSpec (env: Environment): string {
  const dataset = deviceSpec(env)
  return Object
    .entries(dataset)
    .map(([key, value]) => {
      return key + ':\t' + (
        typeof value === 'string'
          ? value
          : value.text
      )
    })
    .join('\n')
}

// https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue#creating-an-issue-from-a-url-query
function openWithGitHubIssue (
  language: Language | string,
  title: string,
  deviceSpec: string,
  stackTrace: string,
) {
  title = '[Bug] ' + title
  stackTrace = '```\n' + stackTrace + '\n```'

  // https://github.com/lgou2w/HoYo.Gacha/tree/main/.github/ISSUE_TEMPLATE
  const template = isChinese(language)
    ? '1-bug-report-chs.yml'
    : '3-bug-report-en.yml'

  const url = new URL(`${__APP_ISSUES__}/new`)
  url.searchParams.append('template', template)
  url.searchParams.append('title', title)
  url.searchParams.append('device-specification', deviceSpec)
  url.searchParams.append('bug-description', stackTrace)
  open(url.toString())
}

function openWithMailto (
  _language: Language | string,
  title: string,
  deviceSpec: string,
  stackTrace: string,
) {
  const body = [
    'Device Specification:',
    deviceSpec,
    '',
    'Stack trace:',
    stackTrace,
  ].join('\n')

  const url = new URL(`mailto:${__APP_AUTHOR__}`)
  url.searchParams.append('subject', title)
  url.searchParams.append('body', body)
  open(url
    .toString()
    .replace(/\+/g, '%20'),
  )
}
