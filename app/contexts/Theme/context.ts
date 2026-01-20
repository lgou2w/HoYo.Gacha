import { createContext } from 'react'
import { ThemeStore } from './store'
import { ThemeData } from './theme'

export interface ThemeState {
  readonly data: ThemeData
  readonly store: ThemeStore
  updateTheme (updated: Partial<ThemeData>): void | Promise<void>
}

export const ThemeContext = createContext<ThemeState | null>(null)

ThemeContext.displayName = 'ThemeContext'
