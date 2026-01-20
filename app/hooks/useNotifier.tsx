import { ReactNode, useCallback, useMemo, useRef } from 'react'
import { Link, Spinner, Toast, ToastBody, ToastTitle, ToastTrigger, useToastController } from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'

export type NotifyOptions = Omit<
  NonNullable<Parameters<ReturnType<typeof useToastController>['dispatchToast']>['1']>,
  'content'
>

export const NotifierId = 'notifier'

export const DefaultNotifierTimeouts = {
  info: 3000,
  success: 3000,
  error: 5000,
  warning: 5000,
} as const

const HandlerDefaultOptions: NotifyOptions = {
  pauseOnHover: true,
  pauseOnWindowBlur: true,
}

export type NotifierPromiseContentOptions
  = & { title: ReactNode }
    & Omit<NotifyOptions, 'intent' | 'toastId'>
    & { dismissible?: boolean, body?: ReactNode }
    | null
    | undefined

export default function useNotifier () {
  const {
    dispatchToast,
    updateToast,
    dismissToast,
    dismissAllToasts,
  } = useToastController(NotifierId)

  const toastCouterRef = useRef(0)
  const genToastId = useCallback(
    () => `${NotifierId}__toast${++toastCouterRef.current}`,
    [],
  )

  const notify = useCallback((
    content: ReactNode,
    options?: NotifyOptions,
  ) => {
    let toastId = options?.toastId
    if (!toastId) {
      toastId = genToastId()
      dispatchToast(
        content,
        {
          ...options,
          toastId,
        },
      )
    } else {
      updateToast({
        ...options,
        toastId,
        content,
      })
    }

    return toastId
  }, [dispatchToast, genToastId, updateToast])

  const { info, success, error, warning } = useMemo(() => {
    const createHandler
      = (defaultOptions: NotifyOptions) =>
        (
          title: ReactNode,
          options?: Omit<NotifyOptions, 'intent'> & {
            dismissible?: boolean
            body?: ReactNode
          },
        ) => {
          const { dismissible, body, ...rest } = options || {}
          notify(
            <Toast>
              <ToastTitle action={dismissible
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
            </Toast>,
            {
              ...defaultOptions,
              ...rest,
            },
          )
        }

    return {
      info: createHandler({
        intent: 'info',
        timeout: DefaultNotifierTimeouts.info,
        ...HandlerDefaultOptions,
      }),
      success: createHandler({
        intent: 'success',
        timeout: DefaultNotifierTimeouts.success,
        ...HandlerDefaultOptions,
      }),
      error: createHandler({
        intent: 'error',
        timeout: DefaultNotifierTimeouts.error,
        ...HandlerDefaultOptions,
      }),
      warning: createHandler({
        intent: 'warning',
        timeout: DefaultNotifierTimeouts.warning,
        ...HandlerDefaultOptions,
      }),
    }
  }, [notify])

  const loading = useCallback((
    title: ReactNode,
    options?: NotifyOptions & { body?: ReactNode },
  ) => {
    const { body, ...rest } = options || {}
    return notify(
      <Toast>
        <ToastTitle media={<Spinner size="extra-tiny" />}>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      {
        timeout: -1,
        ...rest,
      },
    )
  }, [notify])

  const promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    contents: {
      loading: Omit<NonNullable<NotifierPromiseContentOptions>, 'timeout'>
      success?: NotifierPromiseContentOptions | ((value: T) => NotifierPromiseContentOptions)
      error?: NotifierPromiseContentOptions | ((error: unknown) => NotifierPromiseContentOptions)
    },
  ) => Promise<T> = useCallback((promise, contents) => {
    const { title, body, ...rest } = contents.loading
    const toastId = loading(title, { timeout: -1, body, ...rest })

    if (typeof promise === 'function') {
      promise = promise()
    }

    promise.then((value) => {
      const successOptions = typeof contents.success === 'function'
        ? contents.success(value)
        : contents.success

      if (successOptions) {
        const { title, body, ...rest } = successOptions
        success(title, { toastId, body, ...rest })
      } else {
        dismissToast(toastId)
      }

      return value
    }).catch((err) => {
      const errorOptions = typeof contents.error === 'function'
        ? contents.error(err)
        : contents.error

      if (errorOptions) {
        const { title, body, ...rest } = errorOptions
        error(title, { toastId, body, ...rest })
      } else {
        dismissToast(toastId)
      }

      // Re-throw the error so that the caller can handle it
      throw err
    })

    return promise
  }, [dismissToast, error, loading, success])

  return {
    NotifierId,
    info,
    success,
    error,
    warning,
    loading,
    promise,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
  }
}
