import { RefObject, memo, useRef } from 'react'
import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { RestrictToElement } from '@dnd-kit/dom/modifiers'
import { useSortable } from '@dnd-kit/react/sortable'
import { Image, makeStyles, tabClassNames, tokens } from '@fluentui/react-components'
import { AccountBusiness, AccountBusinessKeys } from '@/api/Account'
import BusinessImages from '@/assets/images/BusinessImages'
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

const Navs = AccountBusinessKeys
  .map((keyof) => ({
    keyof,
    pathname: `/Gacha/${keyof}`,
    icon: BusinessImages[keyof].Icon!,
  }))

function shouldBeRendered (
  visibility: BusinessVisibility,
  nav: typeof Navs[number],
): boolean {
  const visible = visibility[AccountBusiness[nav.keyof]]
  return visible === null || visible
}

const BusinessNavs = memo(function BusinessNavs () {
  const styles = useStyles()
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: visibility } = useBusinessVisibilitySuspenseQuery()

  return (
    <div className={styles.root} ref={containerRef}>
      {Navs
        .filter((nav) => shouldBeRendered(visibility, nav))
        .map((nav, index) => (
          <BusinessNav
            key={nav.keyof}
            className={styles.nav}
            index={index}
            pathname={nav.pathname}
            icon={nav.icon}
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
