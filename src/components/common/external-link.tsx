import React, { PropsWithChildren } from 'react'
import Link, { LinkProps } from '@mui/material/Link'

export type ExternalLinkProps = Omit<LinkProps, 'target' | 'rel'>

export default function ExternalLink (props: PropsWithChildren<ExternalLinkProps>) {
  const { href, children, ...rest } = props
  return (
    <Link target="_blank" rel="external nofollow" href={href} {...rest}>
      {children || href}
    </Link>
  )
}
