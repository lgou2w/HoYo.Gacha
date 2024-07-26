import React, { PropsWithChildren, useEffect, useMemo } from 'react'
import { FluentProvider, Theme as FluentTheme } from '@fluentui/react-components'
import { produce } from 'immer'
import { useImmer } from 'use-immer'
import ThemeContext, { ThemeState } from '@/contexts/ThemeContext'
import { ScaleLevel, ThemeData, ThemeStore, Themes } from '@/interfaces/Theme'

interface Props {
  initialData: ThemeData
  store: ThemeStore
}

export default function ThemeProvider (props: PropsWithChildren<Props>) {
  const { initialData, store, children } = props
  const [data, updateData] = useImmer(initialData)
  const state = useMemo<ThemeState>(() => ({
    ...data,
    store,
    async change (updated) {
      const newData = produce(data, (draft) => {
        updated.colorScheme && (draft.colorScheme = updated.colorScheme)
        updated.namespace && (draft.namespace = updated.namespace)
        updated.scale && (draft.scale = updated.scale)
      })

      await store.save(newData)
      updateData(newData)
    }
  }), [data, store, updateData])

  useEffect(
    () => applyScaling(data.scale),
    [data.scale]
  )

  const theme: FluentTheme | undefined = Themes[state.namespace]?.[state.colorScheme]
  if (!theme) {
    throw new Error(`Invalid theme data state: ${state.namespace}.${state.colorScheme}`)
  }

  return (
    <ThemeContext.Provider value={state}>
      <FluentProvider theme={theme} style={{ background: 'transparent' }}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  )
}

// See: src/assets/global.css -> :root
function applyScaling (scale: ScaleLevel) {
  window
    .document
    .documentElement
    .style
    .setProperty('--base-font-size', `${scale}px`)
}
