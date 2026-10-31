import React, { ComponentType, LazyExoticComponent, Suspense } from 'react'
import { Spinner } from '@fluentui/react-components'
import { useClassicSuspenseQuery } from './hooks'

enum AnalysisVersion {
  Classic = 'Classic',
  Remastered = 'Remastered',
}

const AnalysisVersions = Object.values(AnalysisVersion)

const VersionComponents = AnalysisVersions
  .reduce((acc, version) => {
    acc[version] = React.lazy(() => import(`./${version}/index.tsx`))
    return acc
  }, {} as Record<AnalysisVersion, LazyExoticComponent<ComponentType>>)

export default function Analysis () {
  const { data: useClassic } = useClassicSuspenseQuery()
  const Component = VersionComponents[
    useClassic
      ? AnalysisVersion.Classic
      : AnalysisVersion.Remastered
  ]

  return (
    <Suspense fallback={<Spinner />}>
      <Component />
    </Suspense>
  )
}
