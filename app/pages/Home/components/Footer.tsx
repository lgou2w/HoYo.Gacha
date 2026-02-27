import { Caption1, Link, makeStyles, tokens } from '@fluentui/react-components'
import { Trans, WithTransKnownNs } from '@/i18n'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    justifyContent: 'center',
  },
  content: {
    color: tokens.colorNeutralForeground2,
  },
})

export default function Footer () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Caption1 className={styles.content} as="p" block>
        <Trans
          ns={WithTransKnownNs.HomePage}
          i18nKey="Footer.Content"
          components={{
            tauri: <Tauri />,
            heart: <i style={{ color: 'red' }}>&hearts;</i>,
            lgou2w: <Lgou2w />,
          }}
        />
      </Caption1>
    </div>
  )
}

function Tauri () {
  return (
    <Link
      href="https://tauri.app"
      target="_blank"
      rel="noreferrer"
    >
      Tauri
    </Link>
  )
}

function Lgou2w () {
  return (
    <Link
      href="https://lgou2w.com"
      target="_blank"
      rel="noreferrer"
    >
      lgou2w
    </Link>
  )
}
