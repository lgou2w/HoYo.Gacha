import { invoke as _invoke } from '@tauri-apps/api'

const invoke: typeof _invoke = import.meta.env.DEV
  ? (...args) => {
      console.debug('invoke', ...args)
      return _invoke(...args)
    }
  : _invoke

export default invoke
