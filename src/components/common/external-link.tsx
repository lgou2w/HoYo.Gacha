import React, { PropsWithChildren } from 'react'
import Link, { LinkProps } from '@mui/material/Link'

export type ExternalLinkProps = Omit<LinkProps, 'target' | 'rel'>

export default function ExternalLink (props: PropsWithChildren<ExternalLinkProps>) {
  return (
    <Link target="_blank" rel="external nofollow" {...props} />
  )
}
