import React, { Fragment } from 'react'
import { Switch } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
import { invoke } from '@tauri-apps/api/core'
import useTheme from '@/hooks/useTheme'
import rootRoute from '@/pages/Root'

const homeRoute = createRoute({
  path: '/',
  getParentRoute: () => rootRoute,
  component: Home
})

// eslint-disable-next-line react-refresh/only-export-components
function Home () {
  // TODO: Experimental
  const { change, colorScheme } = useTheme()
  const changeTheme = React.useCallback(async (dark: boolean) => {
    await invoke('change_theme', { dark })
    change({
      colorScheme: dark ? 'dark' : 'light'
    })
  }, [change])
  //

  return (
    <Fragment>
      <div>Home</div>
      <Switch label={colorScheme} onClick={() => changeTheme(colorScheme !== 'dark')} />
    </Fragment>
  )
}

export default homeRoute
