import React, { Fragment, PropsWithChildren, ReactNode } from 'react'
import { Subtitle2 } from '@fluentui/react-components'

interface Props {
  title: ReactNode
}

export default function SettingsGroup (props: PropsWithChildren<Props>) {
  return (
    <Fragment>
      <Subtitle2 as="h6">{props.title}</Subtitle2>
      {props.children}
    </Fragment>
  )
}
