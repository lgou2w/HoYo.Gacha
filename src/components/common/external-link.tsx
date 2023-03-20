import React, { PropsWithChildren } from 'react'
import Link, { LinkProps } from '@mui/material/Link'
import Commands from '@/utilities/commands'

export type ExternalLinkProps = Omit<LinkProps, 'target' | 'rel' | 'onClick'>

export default function ExternalLink (props: PropsWithChildren<ExternalLinkProps>) {
  const { href, children, ...rest } = props
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.preventDefault()
    if (href) {
      Commands.open({ path: href })
    }
  }

  return (
    // https://github.com/tauri-apps/tauri/blob/2f70d8da2bc079400bb49e6793f755306049aab2/core/tauri/scripts/core.js#L90
    // Bypassing Tauri's shell module
    // eslint-disable-next-line spaced-comment
    <Link /*target="_blank"*/ rel="external nofollow" href={href} onClick={handleClick} {...rest}>
      {children || href}
    </Link>
  )
}
