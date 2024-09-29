import React, { PropsWithChildren, ReactNode } from 'react'
import { Subtitle2, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalM
  },
  items: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalMNudge
  }
})

interface Props {
  className?: string
  title?: ReactNode
}

export default function SettingsOptionsGroup (props: PropsWithChildren<Props>) {
  const { className, title, children } = props
  const classes = useStyles()
  return (
    <div className={mergeClasses(classes.root, className)}>
      {title && <Subtitle2 as="h6">{title}</Subtitle2>}
      <div className={classes.items}>
        {children}
      </div>
    </div>
  )
}
