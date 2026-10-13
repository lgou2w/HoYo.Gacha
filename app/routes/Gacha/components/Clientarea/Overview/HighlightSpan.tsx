import { PropsWithChildren, ReactNode } from 'react'
import { Tooltip, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'inline-block',
    position: 'relative',
    zIndex: 1,
    color: tokens.colorBrandForeground1,
    userSelect: 'none',
    cursor: 'default',
  },
  interactive: {
    textDecoration: 'underline dashed',
    textDecorationColor: tokens.colorBrandStroke1,
    textDecorationThickness: '1px',
    textUnderlineOffset: '0.25rem',
    cursor: 'help',
  },
  numeric: {
    fontFamily: tokens.fontFamilyMonospace,
  },
  tooltip: {
    whiteSpace: 'pre-wrap',
  },
})

export interface TooltipHighlightSpanProps {
  className?: string
  tooltip?: ReactNode
  numeric?: boolean
}

export default function TooltipHighlightSpan (props: PropsWithChildren<TooltipHighlightSpanProps>) {
  const { tooltip, numeric, className, children } = props
  const styles = useStyles()

  const span = (
    <span
      className={mergeClasses(
        styles.root,
        !!tooltip && styles.interactive,
        numeric && styles.numeric,
        className,
      )}
    >
      {children}
    </span>
  )

  if (!tooltip) {
    return span
  } else {
    return (
      <Tooltip
        content={{
          className: mergeClasses(
            styles.tooltip,
            numeric && styles.numeric,
          ),
          children: tooltip,
        }}
        relationship="description"
        positioning="above"
        withArrow
      >
        {span}
      </Tooltip>
    )
  }
}
