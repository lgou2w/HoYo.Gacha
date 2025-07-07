import { createContext } from 'react'
import { ThemeData, ThemeStore } from '@/interfaces/Theme'

export interface ThemeState extends ThemeData {
  readonly store: ThemeStore
  update (updated: Partial<ThemeData>): void | Promise<void>
}

const ThemeContext = createContext<ThemeState | null>(null)

ThemeContext.displayName = 'ThemeContext'

export default ThemeContext
