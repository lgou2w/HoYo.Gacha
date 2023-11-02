import React, { PropsWithChildren } from 'react'
import { FluentProvider, Theme } from '@fluentui/react-components'
import { KnownThemeSpaces, Themes, ThemeColor } from './index'

interface Props {
  space?: KnownThemeSpaces
  color?: ThemeColor
}

const DefaultThemeSpace: KnownThemeSpaces = 'web'
const DefaultColor: ThemeColor = 'light'

function lookupThemeSpaces (space?: KnownThemeSpaces) {
  space ||= DefaultThemeSpace

  const theme: Record<ThemeColor, Theme> | undefined = Themes[space]
  if (!theme) {
    throw new Error(`Unknown theme space value: ${space}`)
  }

  return theme
}

export default function ThemeProvider (props: PropsWithChildren<Props>) {
  const {
    space = DefaultThemeSpace,
    color = DefaultColor,
    children
  } = props

  const themeSpaces = lookupThemeSpaces(space)
  const theme = themeSpaces[color]

  if (import.meta.env.DEV) {
    console.debug(`Use theme space '${space}' and color '${color}'`)
  }

  return (
    <FluentProvider theme={theme}>
      {children}
    </FluentProvider>
  )
}
