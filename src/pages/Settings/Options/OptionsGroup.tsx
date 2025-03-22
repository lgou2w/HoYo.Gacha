import React, { PropsWithChildren, ReactNode } from 'react'
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

interface Props {
  className?: string
  title?: ReactNode
}

export default function SettingsOptionsGroup (props: PropsWithChildren<Props>) {
  const styles = useStyles()
  const { className, title, children } = props

  return (
    <div className={mergeClasses(styles.root, className)}>
      {title && <Body2 as="h6">{title}</Body2>}
      <div className={styles.items}>
        {children}
      </div>
    </div>
  )
}
