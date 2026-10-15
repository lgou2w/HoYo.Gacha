import React, { ComponentType, LazyExoticComponent, Suspense } from 'react'
import { Spinner, makeStyles, tokens } from '@fluentui/react-components'
import { useClientarea } from '@/routes/Gacha/contexts/Clientarea/hooks'
import { Clientareas, Clientarea as EnumClientarea } from '@/routes/Gacha/contexts/Clientarea/types'
import Actions from './Actions'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 0 auto',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
})

const ClientareaComponents = Clientareas
  .reduce((acc, clientarea) => {
    acc[clientarea] = React.lazy(() => import(`./${clientarea}/index.tsx`))
    return acc
  }, {} as Record<EnumClientarea, LazyExoticComponent<ComponentType>>)

export default function Clientarea () {
  const styles = useStyles()
  const clientarea = useClientarea()
  const Component = ClientareaComponents[clientarea.active]

  return (
    <div className={styles.root}>
      <Actions className={styles.actions} />
      <Suspense fallback={<Spinner />}>
        <Component />
      </Suspense>
    </div>
  )
}
