import { useCallback, useContext } from 'react'
import { changeTheme } from '@/api/commands/core'
import ThemeContext from '@/contexts/ThemeContext'
import { ColorScheme } from '@/interfaces/Theme'

export default function useThemeContext () {
  const state = useContext(ThemeContext)
  if (!state) {
    throw new Error('useThemeContext must be used within a ThemeContext.Provider')
  } else {
    return state
  }
}

export function useColorScheme () {
  const { colorScheme, update } = useThemeContext()

  const change = useCallback(async (newVal: ColorScheme | null) => {
    if (colorScheme !== newVal) {
      await changeTheme({ colorScheme: newVal })
      await update({ colorScheme: newVal })
    }
  }, [colorScheme, update])

  return {
    colorScheme,
    change,
  }
}
