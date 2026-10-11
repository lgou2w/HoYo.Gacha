import { useCallback, useContext, useEffect, useRef } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { ColorScheme, ThemeContext, ThemeContextValue } from './types'

export function useTheme (): ThemeContextValue {
  const state = useContext(ThemeContext)
  if (state) {
    return state
  } else {
    throw new Error('useTheme must be used within an ThemeProvider')
  }
}

export function useColorScheme () {
  const { data: { colorScheme: value }, updateTheme } = useTheme()
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  const setter = useCallback(async (newVal: ColorScheme | null) => {
    if (valueRef.current === newVal) {
      return
    }

    if (isTauri()) {
      await getCurrentWebviewWindow().setTheme(newVal)
    }

    await updateTheme({ colorScheme: newVal })
  }, [updateTheme])

  return [value, setter] as const
}
