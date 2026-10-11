import { CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FluentProvider, FluentProviderProps } from '@fluentui/react-components'
import { isTauri } from '@tauri-apps/api/core'
import { TauriEvent, UnlistenFn, listen } from '@tauri-apps/api/event'
import { produce } from 'immer'
import { CustomStylesHooks } from './CustomStyleHooks'
import { ThemeStore } from './store'
import { ColorScheme, Namespace, ThemeContext, ThemeContextValue, ThemeData, applyScaling, createNamespaceThemes, prefersColorScheme } from './types'

export interface ThemeProviderProps {
  themeData: ThemeData
  themeStore: ThemeStore
  isSupportedMica?: boolean | null
}

export default function ThemeProvider (props: PropsWithChildren<ThemeProviderProps>) {
  const { themeData, themeStore, isSupportedMica, children } = props
  const { state, activeColorScheme } = useTheme(themeData, themeStore)
  const fluentProps = useFluentProps({
    namespace: state.data.namespace,
    colorScheme: activeColorScheme,
    font: state.data.font,
    isSupportedMica,
  })

  return (
    <ThemeContext value={state}>
      <FluentProvider {...fluentProps}>
        {children}
      </FluentProvider>
    </ThemeContext>
  )
}

interface UseTheme {
  state: ThemeContextValue
  activeColorScheme: ColorScheme
}

function useTheme (initial: ThemeData, themeStore: ThemeStore): UseTheme {
  const [themeData, setThemeData] = useState(initial)
  const [activeColorScheme, setActiveColorScheme] = useState(initial.colorScheme || prefersColorScheme())

  const themeDataRef = useRef(initial)
  const themeStoreRef = useRef(themeStore)
  const updateTheme = useCallback<ThemeContextValue['updateTheme']>(async (updated) => {
    const newData = produce(themeDataRef.current, (draft) => {
      updated.colorScheme !== undefined && (draft.colorScheme = updated.colorScheme)
      updated.namespace !== undefined && (draft.namespace = updated.namespace)
      updated.scale !== undefined && (draft.scale = updated.scale)
      updated.font !== undefined && (draft.font = updated.font)
    })

    try {
      await themeStoreRef.current.save(newData)
    } catch (err) {
      console.error('Failed to persist theme data', err)
      return
    }

    themeDataRef.current = newData
    setActiveColorScheme(newData.colorScheme || prefersColorScheme())
    setThemeData(newData)
  }, [])

  const state = useMemo<ThemeContextValue>(
    () => ({ data: themeData, updateTheme }),
    [themeData, updateTheme],
  )

  // Listen to system color scheme changes
  useEffect(() => {
    if (!isTauri()) {
      return
    }

    let unlisten: UnlistenFn | undefined
    let cancelled = false

    listen<ColorScheme>(TauriEvent.WINDOW_THEME_CHANGED, (evt) => {
      console.debug('Theme changed', evt)
      setActiveColorScheme(evt.payload)
    }).then((fn) => {
      if (cancelled) {
        fn()
      } else {
        unlisten = fn
      }
    })

    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [])

  // Apply scaling when scale level changes
  useEffect(
    () => { applyScaling(state.data.scale) },
    [state.data.scale],
  )

  return {
    state,
    activeColorScheme,
  }
}

const MICA_STYLES: CSSProperties = {
  background: 'transparent',
}

interface UseFluentPropsOptions {
  namespace: Namespace
  colorScheme: ColorScheme
  font: ThemeData['font']
  isSupportedMica: ThemeProviderProps['isSupportedMica']
}

function useFluentProps (options: UseFluentPropsOptions): FluentProviderProps {
  const { namespace, colorScheme, font, isSupportedMica } = options
  const themes = useMemo(() => createNamespaceThemes(font), [font])
  return useMemo<FluentProviderProps>(() => ({
    theme: themes[namespace]?.[colorScheme] ?? themes.web[colorScheme],
    style: isSupportedMica ? MICA_STYLES : undefined,
    customStyleHooks_unstable: CustomStylesHooks,
  }), [colorScheme, isSupportedMica, namespace, themes])
}
