import { invoke as _ } from '@tauri-apps/api/core'

const invoke: typeof _ = function invoke (...rest) {
  console.debug('Invoke tauri:', ...rest)
  return _(...rest)
}

export default invoke
