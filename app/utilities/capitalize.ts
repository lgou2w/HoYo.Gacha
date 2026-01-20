function capitalize (str: null): null
function capitalize (str: undefined): undefined
function capitalize<S extends string> (str: S): Capitalize<S>
function capitalize<S extends string> (str: S | null | undefined): Capitalize<S> | undefined | null {
  if (typeof str === 'string') {
    return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<S>
  } else if (str === null) {
    return null
  } else if (typeof str === 'undefined') {
    return undefined
  }
}

export default capitalize
