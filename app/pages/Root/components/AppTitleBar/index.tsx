import { makeStyles, tokens } from '@fluentui/react-components'
import { NavbarWidth, TitleBarHeight } from '@/pages/Root/components/consts'
import Buttons from './Buttons'
import Title from './Title'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    position: 'fixed',
    inset: 0,
    height: TitleBarHeight,
    minHeight: TitleBarHeight,
    maxHeight: TitleBarHeight,
    marginLeft: NavbarWidth,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorTransparentBackground,
    userSelect: 'none',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    flex: '1 0 auto',
    height: '100%',
    pointerEvents: 'none',
    margin: `0 ${tokens.spacingHorizontalL}`,
  },
  buttons: {
    display: 'flex',
    flexShrink: 0,
    height: '100%',
  },
})

export default function AppTitleBar () {
  const styles = useStyles()

  return (
    <header className={styles.root} data-tauri-drag-region>
      <Title className={styles.title} />
      <Buttons className={styles.buttons} />
    </header>
  )
}
