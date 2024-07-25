import React from 'react'
import { ThemeData, ThemeStore } from '@/interfaces/Theme'

export interface ThemeState extends ThemeData {
  readonly store: ThemeStore
  change (updated: Partial<ThemeData>): void | Promise<void>
}

const ThemeContext = React.createContext<ThemeState | null>(null)

ThemeContext.displayName = 'ThemeContext'

export default ThemeContext
