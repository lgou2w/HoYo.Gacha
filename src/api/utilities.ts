export function capitalize (str: null): null
export function capitalize (str: undefined): undefined
export function capitalize (str: string): string
export function capitalize (str: string | null | undefined): string | undefined | null {
  if (str === null) {
    return null
  } else if (typeof str === 'undefined') {
    return undefined
  } else if (typeof str === 'string') {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}
