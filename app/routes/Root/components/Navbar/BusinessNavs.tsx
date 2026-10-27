import { RefObject, memo, useRef } from 'react'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { RestrictToElement } from '@dnd-kit/dom/modifiers'
import { useSortable } from '@dnd-kit/react/sortable'
import { Image, makeStyles, tabClassNames, tokens } from '@fluentui/react-components'
import { BusinessRoute, BusinessRoutes } from '@/routes/Root/hooks/useBusinessRoutes'
import { BusinessVisibility, useBusinessVisibilitySuspenseQuery } from '@/routes/Root/hooks/useBusinessVisibility'
import Nav from './Nav'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  nav: {
    [`& .${tabClassNames.icon}`]: {
      boxShadow: tokens.shadow2,
    },
  },
})

function shouldBeRendered (
  visibility: BusinessVisibility,
  route: BusinessRoute,
): boolean {
  const visible = visibility[route.business]
  return visible === null || visible
}

const BusinessNavs = memo(function BusinessNavs () {
  const styles = useStyles()
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: visibility } = useBusinessVisibilitySuspenseQuery()

  return (
    <div className={styles.root} ref={containerRef}>
      {BusinessRoutes
        .filter((route) => shouldBeRendered(visibility, route))
        .map((route, index) => (
          <BusinessNav
            key={route.keyof}
            className={styles.nav}
            index={index}
            pathname={route.pathname}
            icon={route.icon}
            container={containerRef}
          />
        ))}
    </div>
  )
})

export default BusinessNavs

interface BusinessNavProps {
  className?: string
  index: number
  pathname: string
  icon: string
  container: RefObject<Element | null>
}

function BusinessNav (props: BusinessNavProps) {
  const { className, index, pathname, icon, container } = props
  const { ref } = useSortable({
    index,
    id: pathname,
    modifiers: [
      RestrictToElement.configure({ element: () => container.current }),
      RestrictToVerticalAxis,
    ],
  })

  return (
    <Nav
      ref={ref}
      className={className}
      pathname={pathname}
      icon={<Image src={icon} />}
    />
  )
}
