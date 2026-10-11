import { invoke as n } from '@tauri-apps/api/core'

const invoke: typeof n = import.meta.env.PROD
  ? n
  : (...rest) => {
      console.debug('Invoke Tauri:', ...rest)
      return n(...rest)
    }

export type { InvokeArgs, InvokeOptions } from '@tauri-apps/api/core'
export default invoke
