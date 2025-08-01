import React, { PropsWithChildren, Suspense } from 'react'
import { Await } from '@tanstack/react-router'
import { gitInfo } from '@/api/commands/core'

export default function AuthorOnly (props: PropsWithChildren) {
  return (
    <Suspense>
      <Await promise={gitInfo()}>
        {(info) => isAuthor(info) ? props.children : null}
      </Await>
    </Suspense>
  )
}

// HACK: Author notice
// The advantage of this is that if your repository is a fork version,
// then do not render the automatic update component to avoid overwriting your version.
// You can customize it as you like.
function isAuthor (info: Awaited<ReturnType<typeof gitInfo>>): boolean {
  const RemoteUrl = 'https://github.com/lgou2w/HoYo.Gacha.git'
  return info.remoteUrl === RemoteUrl
}
