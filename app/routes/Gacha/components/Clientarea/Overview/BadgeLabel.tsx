import { Badge, BadgeProps, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    flex: '0 0 auto',
    boxShadow: tokens.shadow2,
    whiteSpace: 'pre-wrap',
  },
})

export default function BadgeLabel (props: BadgeProps) {
  const {
    className,
    appearance = 'filled',
    color = 'informative',
    size = 'large',
    children,
    ...rest
  } = props
  const styles = useStyles()

  return (
    <Badge
      className={mergeClasses(styles.root, className)}
      appearance={appearance}
      color={color}
      size={size}
      {...rest}
    >
      {children}
    </Badge>
  )
}
