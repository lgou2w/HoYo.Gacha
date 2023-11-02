import { invoke as invokeTauri } from '@tauri-apps/api'

const invoke: typeof invokeTauri = (...args) => {
  console.debug('Invoke tauri with arguments:', ...args)
  return invokeTauri(...args)
}

export default invoke
