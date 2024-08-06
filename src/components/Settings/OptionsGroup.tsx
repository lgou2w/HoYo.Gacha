import React, { ReactNode } from 'react'
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

type Props = Omit<React.JSX.IntrinsicElements['div'], 'title'> & {
  title?: ReactNode
}

export default function SettingsOptionsGroup (props: Props) {
  const { className, title, children, ...rest } = props
  const classes = useStyles()
  return (
    <div className={mergeClasses(classes.root, className)} {...rest}>
      {title && <Subtitle2 as="h6">{title}</Subtitle2>}
      <div className={classes.items}>
        {children}
      </div>
    </div>
  )
}
