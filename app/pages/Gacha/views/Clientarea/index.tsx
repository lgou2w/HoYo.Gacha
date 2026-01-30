import { ComponentType, LazyExoticComponent, Suspense, lazy, useMemo } from 'react'
import { Spinner, makeStyles, tokens } from '@fluentui/react-components'
import { Clientarea, Clientareas, useClientarea } from '@/pages/Gacha/contexts/Clientarea'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
})

const ClientareaComponents = Clientareas
  .reduce((acc, clientarea) => {
    acc[clientarea] = lazy(() => import(`./${clientarea}/index.tsx`))
    return acc
  }, {} as Record<Clientarea, LazyExoticComponent<ComponentType>>)

export default function ClientareaView () {
  const styles = useStyles()
  const clientarea = useClientarea()
  const Component = useMemo(
    () => ClientareaComponents[clientarea.active],
    [clientarea.active],
  )

  return (
    <div className={styles.root}>
      <Suspense fallback={<Spinner />}>
        <Component />
      </Suspense>
    </div>
  )
}
