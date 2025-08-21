import React, { PropsWithChildren, useEffect, useMemo } from 'react'
import { FluentProvider, tokens } from '@fluentui/react-components'
import { produce } from 'immer'
import { useImmer } from 'use-immer'
import CustomStylesHooks from '@/components/CustomStyleHooks'
import ThemeContext, { ThemeState } from '@/contexts/ThemeContext'
import { ScaleLevel, ThemeData, ThemeStore, VAR_BASE_FONT_SIZE, createFluentThemes } from '@/interfaces/Theme'

interface Props {
  supportedWindowVibrancy: boolean
  initialData: ThemeData
  store: ThemeStore
}

export default function ThemeProvider (props: PropsWithChildren<Props>) {
  const { supportedWindowVibrancy, initialData, store, children } = props
  const [data, updateData] = useImmer(initialData)
  const state = useMemo<ThemeState>(() => ({
    ...data,
    store,
    async update (updated) {
      const newData = produce(data, (draft) => {
        updated.colorScheme && (draft.colorScheme = updated.colorScheme)
        updated.namespace && (draft.namespace = updated.namespace)
        updated.scale && (draft.scale = updated.scale)
        updated.font !== undefined && (draft.font = updated.font)
      })

      await store.save(newData)
      updateData(newData)
    },
  }), [data, store, updateData])

  useEffect(
    () => applyScaling(data.scale),
    [data.scale],
  )

  const themes = useMemo(() => createFluentThemes(data.font), [data.font])
  if (!themes[state.namespace]?.[state.colorScheme]) {
    throw new Error(`Invalid theme data state: ${state.namespace}.${state.colorScheme}`)
  }

  if (!supportedWindowVibrancy) {
    console.debug('Vibrancy is not supported on this system')
  }

  return (
    <ThemeContext.Provider value={state}>
      <FluentProvider
        theme={themes[state.namespace][state.colorScheme]}
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
