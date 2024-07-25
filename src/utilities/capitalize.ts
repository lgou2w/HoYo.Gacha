function capitalize (str: null): null
function capitalize (str: undefined): undefined
function capitalize (str: string): string
function capitalize (str: string | null | undefined): string | undefined | null {
  if (typeof str === 'string') {
    return str.charAt(0).toUpperCase() + str.slice(1)
  } else if (str === null) {
    return null
  } else if (typeof str === 'undefined') {
    return undefined
  }
}

export default capitalize
