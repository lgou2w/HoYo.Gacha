import { RefObject, useCallback, useEffect, useRef } from 'react'
import { Divider, SelectTabEventHandler, TabList, makeStyles } from '@fluentui/react-components'
import { useLocation, useNavigate } from '@tanstack/react-router'
import Spacing from '@/components/Spacing'
import BrandNav from './BrandNav'
import BusinessNavs from './BusinessNavs'
import SettingsNav from './SettingsNav'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
  },
  divider: {
    flex: '0 0 2%',
  },
})

export default function Navs () {
  const styles = useStyles()

  const location = useLocation()
  const navigate = useNavigate()
  const handleTabSelect = useCallback<SelectTabEventHandler>((_, data) => {
    if (typeof data.value === 'string' && data.value) {
      console.debug('Navigate to:', data.value)
      navigate({
        to: data.value,
      })
    }
  }, [navigate])

  // HACK: Development only!
  //   This side effect is used to observe the height of
  //   the Tanstack Query Devtools panel and apply it to the TabList.
  //   Avoid bottom routing buttons being covered.
  const ref = useRef<HTMLDivElement>(null)
  useTsqdSideEffect(ref)

  return (
    <TabList
      ref={ref}
      className={styles.root}
      selectedValue={location.pathname}
      onTabSelect={handleTabSelect}
      size="large"
      vertical
    >
      <BrandNav />
      <Spacing />
      <BusinessNavs />
      <Divider className={styles.divider} inset />
      <SettingsNav />
    </TabList>
  )
}

// See also above
const TsqdClassName = 'tsqd-parent-container'

function useTsqdSideEffect (ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (!ref.current) return

    const container = ref.current
    const tsqd = document.getElementsByClassName(TsqdClassName).item(0)
    if (!tsqd) return

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes'
          && mutation.target instanceof HTMLElement
          && mutation.target.classList.contains('tsqd-main-panel')) {
          updateMaxHeight(container, mutation.target)
        }
      }
    })

    // Find child element when onmount and updates them once
    updateMaxHeight(container, tsqd.querySelector('.tsqd-main-panel'))

    observer.observe(tsqd, {
      attributes: true,
      subtree: true,
      childList: true,
    })

    return () => {
      updateMaxHeight(container, null)
      observer.disconnect()
    }
  }, [ref])
}

function updateMaxHeight (container: HTMLElement, target: HTMLElement | null) {
  let targetHeight = 0
  if (target && (targetHeight = target.clientHeight) > 0) {
    container.style.maxHeight = `calc(100% - ${targetHeight}px)`
  } else {
    container.style.removeProperty('max-height')
  }
}
