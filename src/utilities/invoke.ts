import { invoke as _invoke } from '@tauri-apps/api'

const invoke: typeof _invoke = (...args) => {
  console.debug('invoke', ...args)
  return _invoke(...args)
}

export default invoke
