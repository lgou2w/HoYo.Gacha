import { use, useCallback } from 'react'
import AppCommands from '@/api/commands/app'
import { ThemeContext } from './context'
import { ColorScheme } from './theme'

export function useTheme () {
  const state = use(ThemeContext)
  if (!state) {
    throw new Error('useTheme must be used within a ThemeProvider')
  } else {
    return state
  }
}

export function useColorScheme () {
  const { data: { colorScheme: value }, updateTheme } = useTheme()
  const setter = useCallback(async (newVal: ColorScheme | null) => {
    if (value !== newVal) {
      await AppCommands.changeColorScheme({ value: newVal })
      await updateTheme({ colorScheme: newVal })
    }
  }, [value, updateTheme])

  return [value, setter] as const
}
