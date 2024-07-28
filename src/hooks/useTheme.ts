import { useCallback, useContext } from 'react'
import { changeTheme } from '@/api/commands/core'
import ThemeContext from '@/contexts/ThemeContext'
import { ColorScheme, Dark, Light } from '@/interfaces/Theme'

export default function useTheme () {
  const state = useContext(ThemeContext)
  if (!state) {
    throw new Error('useTheme must be used within a ThemeContext.Provider')
  } else {
    return state
  }
}

export function useColorScheme () {
  const { colorScheme, update } = useTheme()

  const change = useCallback(async (newVal: ColorScheme) => {
    if (colorScheme !== newVal) {
      update({ colorScheme: newVal })
      changeTheme({ colorScheme: newVal })
    }
  }, [colorScheme, update])

  const toggle = useCallback(
    () => change(colorScheme === Dark ? Light : Dark),
    [change, colorScheme]
  )

  return {
    colorScheme,
    change,
    toggle
  }
}
