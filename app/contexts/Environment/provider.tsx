import { PropsWithChildren } from 'react'
import { Environment } from '@/api/commands/app'
import { EnvironmentContext } from './context'

interface Props {
  environment: Environment
}

export default function EnvironmentProvider (props: PropsWithChildren<Props>) {
  const { environment, children } = props

  return (
    <EnvironmentContext value={environment}>
      {children}
    </EnvironmentContext>
  )
}
