import { useContext } from 'react'
import ThemeContext from '@/contexts/ThemeContext'

export default function useTheme () {
  const state = useContext(ThemeContext)
  if (!state) {
    throw new Error('useTheme must be used within a ThemeContext.Provider')
  } else {
    return state
  }
}
