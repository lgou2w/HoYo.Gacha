import React, { PropsWithChildren, useEffect } from 'react'
import { FluentProvider, Theme as FluentTheme } from '@fluentui/react-components'
import { useImmer } from 'use-immer'
import { ThemeContext, ThemeContextState } from './Context'
import { Themes } from './declares'

type ThemeData = Pick<ThemeContextState, 'space' | 'color' | 'zoom'>

const DefaultThemeData: ThemeData = { space: 'web', color: 'light', zoom: 16 }
const LocalStorageKey = 'HG_THEME_DATA'

function initializeThemeData (): ThemeData {
  const data = { ...DefaultThemeData }
  const stringifyData = window.localStorage.getItem(LocalStorageKey)
  if (!stringifyData) {
    return data
  }

  let parsed: Partial<ThemeData>
  try {
    parsed = JSON.parse(stringifyData)
  } catch (e) {
    console.error(`Invalid json theme data: ${stringifyData}.`, e)
    window.localStorage.removeItem(LocalStorageKey)
    return data
  }

  const { space, color, zoom } = parsed
  const valid = !!space && !!color && typeof Themes[space]?.[color] !== 'undefined'
  if (!valid) {
    console.warn(`Invalid theme space value: ${space}.${color}`)
    window.localStorage.removeItem(LocalStorageKey)
    return data
  }

  return {
    space,
    color,
    zoom: zoom || DefaultThemeData.zoom
  }
}

function onThemeDataChange (data: ThemeData) {
  let stringifyData: string
  try {
    stringifyData = JSON.stringify(data)
  } catch (e) {
    console.error('Failed to stringify theme data:', e)
    return
  }

  window.localStorage.setItem(LocalStorageKey, stringifyData)
}

// See: src/assets/global.css -> :root
function applyInterfaceScaling (zoom: ThemeData['zoom']) {
  window
    .document
    .documentElement
    .style
    .setProperty('--base-font-size', `${zoom}px`)
}

export default function Theme (props: PropsWithChildren) {
  const [data, updateData] = useImmer(initializeThemeData)
  const state: ThemeContextState = {
    ...data,
    toggleColor (dark) {
      updateData((draft) => {
        if (typeof dark === 'boolean') {
          draft.color = !dark ? 'light' : 'dark'
        } else {
          draft.color = draft.color === 'dark' ? 'light' : 'dark'
        }
        onThemeDataChange(draft)
      })
    },
    change ({ space, color, zoom }) {
      if (space || color || zoom) {
        updateData((draft) => {
          space && (draft.space = space)
          color && (draft.color = color)
          zoom && (draft.zoom = zoom)
          onThemeDataChange(draft)
        })
      }
    }
  }

  const theme: FluentTheme | undefined = Themes[state.space]?.[state.color]
  if (!theme) {
    throw new Error(`Unknown theme space value: ${state.space}.${state.color}`)
  }

  useEffect(() => {
    applyInterfaceScaling(state.zoom)
  }, [state.zoom])

  return (
    <ThemeContext.Provider value={state}>
      <FluentProvider theme={theme}>
        {props.children}
      </FluentProvider>
    </ThemeContext.Provider>
  )
}

// FIXME: https://github.com/tauri-apps/tauri/issues/8180
// export default function ThemeProvider (props: PropsWithChildren) {
//   const [state, setState] = useState<{
//     vibrancy: boolean
//     space: KnownThemeSpaces
//     color: ThemeColor
//   }>(
//     WindowVibrancy
//       ? { vibrancy: true, space: 'vibrancy', color: 'dark' }
//       : { vibrancy: false, space: 'blue', color: 'light' }
//   )

//   useEffect(() => {
//     const query = window.matchMedia('(prefers-color-scheme: dark)')
//     const listener = (evt: MediaQueryListEvent) => {
//       if (!WindowVibrancy && !evt.matches) {
//         setState({
//           vibrancy: false,
//           space: 'blue',
//           color: evt.matches ? 'dark' : 'light'
//         })
//       }
//     }

//     query.addEventListener('change', listener)
//     return () => {
//       query.removeEventListener('change', listener)
//     }
//   }, [])

//   return (
//     <FluentProvider
//       theme={lookupThemeSpaces(state.space)[state.color]}
//       style={
//         state.vibrancy
//           ? { background: 'transparent' } // Important !
//           : undefined
//       }
//     >
//       {props.children}
//     </FluentProvider>
//   )
// }
