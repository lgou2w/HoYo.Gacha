import React, { ComponentType, LazyExoticComponent, Suspense, createElement, lazy } from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { Tabs } from '@/pages/Gacha/LegacyView/declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',

    // Test
    height: '60vh',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '8rem',
    color: tokens.colorNeutralBackground6,
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
  const { className, tab, ...rest } = props
  const classes = useStyles()
  return (
    <div className={mergeClasses(classes.root, className)} {...rest}>
      <Suspense fallback="Loading...">
        {createElement(Areas[tab])}
      </Suspense>
    </div>
  )
}
