import { PropsWithChildren } from 'react'
import { Environment } from '@/api/App'
import { EnvironmentContext } from './types'

interface EnvironmentProviderProps {
  value: Environment
}

export default function EnvironmentProvider (props: PropsWithChildren<EnvironmentProviderProps>) {
  const { value, children } = props

  return (
    <EnvironmentContext value={value}>
      {children}
    </EnvironmentContext>
  )
}
