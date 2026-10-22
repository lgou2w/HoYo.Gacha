import { ReactNode, useCallback, useMemo } from 'react'
import { Link, Slot, Spinner, Toast, ToastBody, ToastFooter, ToastIntent, ToastTitle, ToastTrigger, useToastController } from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'

// Because Fluent UI does not export them
type UseToastController = ReturnType<typeof useToastController>
type ToastDispatchOptions = NonNullable<Parameters<UseToastController['dispatchToast']>[1]>

// Types
export type NotifyOptions = Omit<ToastDispatchOptions, 'content'>
export interface NotifyExtendedOptions {
  dismissible?: boolean
  body?: ReactNode
  footer?: ReactNode
}

export type NotifyIntent = ToastIntent
export type IntentionNotifyOptions = Omit<NotifyOptions, 'intent'>
export type IntentionNotifier = Record<
  NotifyIntent,
  (
    title: ReactNode,
    options?:
      & IntentionNotifyOptions
      & NotifyExtendedOptions,
  ) => void
>

export type LoadableNotifyOptions
  = & Omit<NotifyOptions, 'intent'>
    & NotifyExtendedOptions

export type PromiseNotifyContentOptions
  = | ({ title: ReactNode } & Omit<NotifyOptions, 'toastId' | 'intent'> & NotifyExtendedOptions)
    | null
    | undefined

export interface PromiseNotifyContents<T, E = unknown> {
  loading: Omit<NonNullable<PromiseNotifyContentOptions>, 'timeout'>
  success?: PromiseNotifyContentOptions | ((value: T) => PromiseNotifyContentOptions)
  error?: PromiseNotifyContentOptions | ((error: E) => PromiseNotifyContentOptions)
}

export interface UseNotifier extends IntentionNotifier {
  readonly toasterId: string
  loading (title: ReactNode, options?: LoadableNotifyOptions): void
  promise<T, E = unknown> (
    input: Promise<T> | (() => Promise<T>),
    contents: PromiseNotifyContents<T, E>
  ): Promise<T>
  dismiss (toastId: string): void
  dismissAll (): void
}

// Impls

const IntentionDefaultOptions: IntentionNotifyOptions = {
  pauseOnHover: true,
  pauseOnWindowBlur: true,
}

export const DefaultNotifierTimeouts = {
  info: 3000,
  success: 3000,
  error: 5000,
  warning: 5000,
} as const

/**
 * Monotonic + nonce: a module-level counter survives remounts (`StrictMode`
 * double mount, `key` changes, error-boundary recovery), and the random
 * suffix keeps ids unique across Vite HMR module reloads.
 *
 * `crypto.randomUUID` is avoided on purpose: Tauri's internal scheme
 * (`http://tauri.localhost` on Windows) is not a secure context.
 */
let toastIdCounter = 0
function nextToastId (toasterId: string): string {
  return `${toasterId}__${++toastIdCounter}_${Math.random().toString(36).slice(2, 8)}`
}

interface RenderToastContentOptions {
  title: ReactNode
  dismissible?: boolean
  media?: Slot<'div'>
  body?: ReactNode
  footer?: ReactNode
}

function renderToastContent (options: RenderToastContentOptions): ReactNode {
  const { title, body, footer, media, dismissible } = options
  return (
    <Toast>
      <ToastTitle
        media={media}
        action={dismissible
          ? (
              <ToastTrigger>
                <Link><DismissRegular /></Link>
              </ToastTrigger>
            )
          : undefined}
      >
        {title}
      </ToastTitle>
      {body && <ToastBody>{body}</ToastBody>}
      {footer && <ToastFooter>{footer}</ToastFooter>}
    </Toast>
  )
}

type NotifyFn = (content: ReactNode, options?: NotifyOptions) => string

function createIntentionHandler (
  intent: NotifyIntent,
  defaultOptions: IntentionNotifyOptions,
  notify: NotifyFn,
) {
  return (
    title: ReactNode,
    options?:
      & IntentionNotifyOptions
      & NotifyExtendedOptions,
  ): void => {
    const { dismissible, body, footer, ...rest } = options || {}
    notify(
      renderToastContent({ title, dismissible, body, footer }),
      {
        ...defaultOptions,
        ...rest,
        intent,
      },
    )
  }
}

function createLoadingHandler (
  notify: NotifyFn,
): UseNotifier['loading'] {
  return (
    title: ReactNode,
    options?: LoadableNotifyOptions,
  ): void => {
    const { dismissible, body, footer, ...rest } = options || {}
    notify(
      renderToastContent({
        title,
        dismissible,
        body,
        footer,
        media: <Spinner size="extra-tiny" />,
      }),
      {
        ...rest,
        timeout: -1,
      },
    )
  }
}

function createPromiseHandler (
  notify: NotifyFn,
  dismissToast: (toastId: string) => void,
  intents: IntentionNotifier,
): UseNotifier['promise'] {
  return (
    input,
    contents,
  ) => {
    const { title, body, footer, ...rest } = contents.loading
    const toastId = notify(
      renderToastContent({
        title,
        dismissible: contents.loading.dismissible,
        body,
        footer,
        media: <Spinner size="extra-tiny" />,
      }),
      {
        ...rest,
        timeout: -1,
      },
    )

    const promise = typeof input === 'function' ? input() : input

    promise.then((value) => {
      const options = typeof contents.success === 'function'
        ? contents.success(value)
        : contents.success

      if (options) {
        const { title, body, footer, ...rest } = options
        intents.success(title, { toastId, body, footer, ...rest })
      } else {
        dismissToast(toastId)
      }

      return value
    }).catch((error) => {
      const options = typeof contents.error === 'function'
        ? contents.error(error)
        : contents.error

      if (options) {
        const { title, body, footer, ...rest } = options
        intents.error(title, { toastId, body, footer, ...rest })
      } else {
        dismissToast(toastId)
      }

      // Do NOT re-throw: `return promise` below hands the original promise
      // to the caller, whose `await` already surfaces this rejection.
      // Re-throwing here would only produce an unhandled rejection from
      // this discarded `.then().catch()` chain.
    })

    return promise
  }
}

export default function useNotifier (toasterId: string): UseNotifier {
  const {
    dispatchToast,
    updateToast,
    dismissToast,
    dismissAllToasts,
  } = useToastController(toasterId)

  const genToastId = useCallback(
    () => nextToastId(toasterId),
    [toasterId],
  )

  // Dispatches a new toast, or updates an existing one when `toastId` is
  // supplied. Returns the id so callers can update/dismiss it later.
  const notify = useCallback<NotifyFn>((content, options) => {
    let toastId = options?.toastId
    if (!toastId) {
      toastId = genToastId()
      dispatchToast(content, { ...options, toastId })
    } else {
      updateToast({ ...options, toastId, content })
    }
    return toastId
  }, [dispatchToast, genToastId, updateToast])

  const intents = useMemo<IntentionNotifier>(() => ({
    info: createIntentionHandler('info', {
      timeout: DefaultNotifierTimeouts.info,
      ...IntentionDefaultOptions,
    }, notify),
    success: createIntentionHandler('success', {
      timeout: DefaultNotifierTimeouts.success,
      ...IntentionDefaultOptions,
    }, notify),
    error: createIntentionHandler('error', {
      timeout: DefaultNotifierTimeouts.error,
      ...IntentionDefaultOptions,
    }, notify),
    warning: createIntentionHandler('warning', {
      timeout: DefaultNotifierTimeouts.warning,
      ...IntentionDefaultOptions,
    }, notify),
  }), [notify])

  const loading = useMemo(
    () => createLoadingHandler(notify),
    [notify],
  )

  const promise = useMemo(
    () => createPromiseHandler(notify, dismissToast, intents),
    [dismissToast, intents, notify],
  )

  const dismiss = useCallback(
    (toastId: string) => dismissToast(toastId),
    [dismissToast],
  )

  const dismissAll = useCallback(
    () => dismissAllToasts(),
    [dismissAllToasts],
  )

  return useMemo<UseNotifier>(() => ({
    toasterId,
    ...intents,
    loading,
    promise,
    dismiss,
    dismissAll,
  }), [dismiss, dismissAll, intents, loading, promise, toasterId])
}
