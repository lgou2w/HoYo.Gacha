import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  numeric: {
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: 'pre-wrap',
  },
  separator: {
    color: tokens.colorNeutralForeground1,
  },
})

export interface NumericValueProps {
  sum: number
  pct: number
  average?: boolean
}

export default function NumericValue (props: NumericValueProps) {
  const { sum, pct, average } = props
  const styles = useStyles()

  if (average) {
    if (pct && pct > 0) {
      return (
        <>
          <span className={styles.numeric}>{sum}</span>
          <span className={styles.separator}>{` / `}</span>
          <span className={styles.numeric}>{pct}</span>
        </>
      )
    } else {
      return (
        <span className={styles.numeric}>
          {sum}
        </span>
      )
    }
  }

  return (
    <>
      <span className={styles.numeric}>
        {sum}
      </span>
      <span className={styles.separator}>
        {` [ `}
      </span>
      <span className={styles.numeric}>
        {`${formatPercentage(pct)}%`}
      </span>
      <span className={styles.separator}>
        {` ]`}
      </span>
    </>
  )
}

/**
 * Formats a percentage value to a string with two decimal places,
 * ensuring the integer part is at least two characters wide.
 */
function formatPercentage (pct: number): string {
  const [int, frac] = pct.toFixed(2).split('.')
  return `${int.padStart(2, ' ')}.${frac}`
}
