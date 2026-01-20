import { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Body2, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalM,
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalMNudge,
  },
})

export interface SectionGroupProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  title?: ReactNode
}

export default function SectionGroup (props: SectionGroupProps) {
  const styles = useStyles()
  const { className, title, children, ...rest } = props

  return (
    <section className={mergeClasses(styles.root, className)} {...rest}>
      {title && <Body2 as="h6">{title}</Body2>}
      <div className={styles.items}>
        {children}
      </div>
    </section>
  )
}
