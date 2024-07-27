import { invoke as _ } from '@tauri-apps/api/core'

export type { InvokeArgs, InvokeOptions } from '@tauri-apps/api/core'

const invoke: typeof _ = function invoke (...rest) {
  console.debug('Invoke tauri:', ...rest) // For trace
  return _(...rest)
}

export default invoke
