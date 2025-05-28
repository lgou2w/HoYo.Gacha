import React, { ComponentType, LazyExoticComponent, Suspense, lazy, useMemo } from 'react'
import { Spinner, makeStyles, mergeClasses } from '@fluentui/react-components'
import { Tabs } from '@/pages/Gacha/LegacyView/declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
})

const Areas = Object
  .values(Tabs)
  .reduce((acc, tab) => {
    acc[tab] = lazy(() => import(`./${tab}/index.tsx`))
    return acc
  }, {} as Record<Tabs, LazyExoticComponent<ComponentType>>)

type Props = Omit<React.JSX.IntrinsicElements['div'], 'children'> & {
  tab: Tabs
}

export default function GachaLegacyViewClientarea (props: Props) {
  const styles = useStyles()
  const { className, tab, ...rest } = props
  const Area = useMemo(() => Areas[tab], [tab])

  return (
    <div className={mergeClasses(styles.root, className)} {...rest}>
      <Suspense fallback={<Spinner />}>
        <Area />
      </Suspense>
    </div>
  )
}
