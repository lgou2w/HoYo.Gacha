import React from 'react'
import { ThemeColor, ThemeSpace } from './Declares'

export interface ThemeContextState {
  space: ThemeSpace
  color: ThemeColor
  zoom: 16 | 20 | 24 | 28 | 32 // 1.0x, 1.2x, 1.5x, 1.8x, 2.0x

  toggleColor (dark?: boolean): void
  change (state: {
    space?: ThemeSpace,
    color?: ThemeColor,
    zoom?: ThemeContextState['zoom']
  }): void
}

export const ThemeContext =
  React.createContext<ThemeContextState | null>(null)

ThemeContext.displayName = 'ThemeContext'
