import { useContext } from 'react'
import { ThemeContext, ThemeContextState } from './Context'

export default function useTheme (): ThemeContextState {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error('useTheme must be used within a ThemeContext.Provider')
  } else {
    return value
  }
}
