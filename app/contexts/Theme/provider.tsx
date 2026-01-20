import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { FluentProvider, FluentProviderProps } from '@fluentui/react-components'
import { UnlistenFn, listen } from '@tauri-apps/api/event'
import { produce } from 'immer'
import { useImmer } from 'use-immer'
import { CustomStylesHooks } from './CustomStyleHooks'
import { ThemeContext, ThemeState } from './context'
import { ThemeStore } from './store'
import { ColorScheme, ThemeData, applyScaling, createFluentThemes, prefersColorScheme } from './theme'

// See: tauri/src/bootstrap/tauri.rs
const EVENT_THEME_CHANGED = 'HG_THEME_CHANGED'

interface Props {
  themeData: ThemeData
  themeStore: ThemeStore
  isSupportedMica?: boolean | null
}

export default function ThemeProvider (props: PropsWithChildren<Props>) {
  const { children, ...rest } = props
  const { state, fluentProps } = useThemeState(rest)

  return (
    <ThemeContext value={state}>
      <FluentProvider {...fluentProps}>
        {children}
      </FluentProvider>
    </ThemeContext>
  )
}

function useThemeState (props: Props) {
  const { themeData: data, themeStore: store, isSupportedMica } = props
  const [theme, setTheme] = useImmer(data)
  const [activeColorScheme, setActiveColorScheme] = useState(theme.colorScheme || prefersColorScheme())
  const state = useMemo<ThemeState>(() => ({
    data: theme,
    store,
    async updateTheme (updated) {
      const newData = produce(theme, (draft) => {
        updated.colorScheme !== undefined && (draft.colorScheme = updated.colorScheme)
        updated.namespace && (draft.namespace = updated.namespace)
        updated.scale && (draft.scale = updated.scale)
        updated.font !== undefined && (draft.font = updated.font)
      })

      // 1. Persist new theme data
      // 2. Update active color scheme
      // 3. Update theme data
      await store.save(newData)
      setActiveColorScheme(newData.colorScheme || prefersColorScheme())
      setTheme(newData)
    },
  }), [setTheme, store, theme])

  // Apply scaling when scale level changes
  useEffect(
    () => applyScaling(state.data.scale),
    [state.data.scale],
  )

  // Listen to system color scheme changes
  useEffect(() => {
    let unlisten: UnlistenFn
    ;(async () => {
      unlisten = await listen<ColorScheme>(EVENT_THEME_CHANGED, (event) => {
        setActiveColorScheme(event.payload)
      })
    })()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [])

  // Recreate themes only when font changes
  const themes = useMemo(
    () => createFluentThemes(state.data.font),
    [state.data.font],
  )

  // Validate current theme data
  if (!themes[state.data.namespace]?.[activeColorScheme]) {
    throw new Error(`Invalid theme data state: ${state.data.namespace}.${activeColorScheme}`)
  }

  // Prepare Fluent Provider props
  const fluentProps: FluentProviderProps = {
    theme: themes[state.data.namespace][activeColorScheme],
    customStyleHooks_unstable: CustomStylesHooks,
    // Mica effect requires transparent background
    style: isSupportedMica
      ? { backgroundColor: 'transparent' }
      : undefined,
  }

  return {
    state,
    fluentProps,
  }
}
