import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { FluentProvider, tokens } from '@fluentui/react-components'
import { listen } from '@tauri-apps/api/event'
import { produce } from 'immer'
import { useImmer } from 'use-immer'
import CustomStylesHooks from '@/components/CustomStyleHooks'
import ThemeContext, { ThemeState } from '@/contexts/ThemeContext'
import { ColorScheme, Dark, Light, ScaleLevel, ThemeData, ThemeStore, VAR_BASE_FONT_SIZE, createFluentThemes } from '@/interfaces/Theme'

const EVENT_COLOR_SCHEME_CHANGED = 'HG_COLOR_SCHEME_CHANGED'

interface Props {
  supportedWindowVibrancy: boolean
  initialData: ThemeData
  store: ThemeStore
}

export default function ThemeProvider (props: PropsWithChildren<Props>) {
  const { supportedWindowVibrancy, initialData, store, children } = props
  const [data, updateData] = useImmer(initialData)
  const [colorScheme, setColorScheme] = useState(data.colorScheme || prefersColorScheme())
  const state = useMemo<ThemeState>(() => ({
    ...data,
    store,
    async update (updated) {
      const newData = produce(data, (draft) => {
        updated.colorScheme !== undefined && (draft.colorScheme = updated.colorScheme)
        updated.namespace && (draft.namespace = updated.namespace)
        updated.scale && (draft.scale = updated.scale)
        updated.font !== undefined && (draft.font = updated.font)
      })

      await store.save(newData)
      setColorScheme(newData.colorScheme || prefersColorScheme())
      updateData(newData)
    },
  }), [data, store, updateData])

  useEffect(
    () => applyScaling(state.scale),
    [state.scale],
  )

  useEffect(() => {
    let unlisten: () => void
    ;(async () => {
      unlisten = await listen(EVENT_COLOR_SCHEME_CHANGED, (event) => {
        setColorScheme(event.payload as ColorScheme)
      })
    })()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [])

  const themes = useMemo(() => createFluentThemes(state.font), [state.font])
  if (!themes[state.namespace]?.[colorScheme]) {
    throw new Error(`Invalid theme data state: ${state.namespace}.${colorScheme}`)
  }

  if (!supportedWindowVibrancy) {
    console.debug('Vibrancy is not supported on this system')
  }

  return (
    <ThemeContext.Provider value={state}>
      <FluentProvider
        theme={themes[state.namespace][colorScheme]}
        style={{ background: supportedWindowVibrancy ? tokens.colorTransparentBackground : tokens.colorNeutralBackground3 }}
        customStyleHooks_unstable={CustomStylesHooks}
      >
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  )
}

// See: src/hooks/useAppInit/useGlobalStyles.ts -> :root
function applyScaling (scale: ScaleLevel) {
  window
    .document
    .documentElement
    .style
    .setProperty(VAR_BASE_FONT_SIZE, `${scale}px`)
}

function prefersColorScheme (): ColorScheme {
  return globalThis.matchMedia('(prefers-color-scheme: light)').matches
    ? Light
    : Dark
}
