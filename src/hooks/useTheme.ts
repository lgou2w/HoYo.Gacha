import { useCallback, useContext } from 'react'
import { setWindowTheme } from '@/api/commands/core'
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
  const { colorScheme, change: changeTheme } = useTheme()

  const change = useCallback(async (val: ColorScheme) => {
    if (colorScheme !== val) {
      changeTheme({ colorScheme: val })
      setWindowTheme({ dark: val === Dark })
    }
  }, [colorScheme, changeTheme])

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
