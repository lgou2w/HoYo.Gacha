import { makeStyles } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    flex: '1 0 auto',
  },
})

export default function Spacing () {
  const styles = useStyles()
  return (
    <div
      className={styles.root}
      aria-label="spacing"
      aria-hidden
    />
  )
}
