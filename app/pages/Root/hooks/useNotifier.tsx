import { ReactNode, useCallback, useMemo, useRef } from 'react'
import { Link, Spinner, Toast, ToastBody, ToastFooter, ToastTitle, ToastTrigger, useToastController } from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'

export type NotifyOptions = Omit<
  NonNullable<Parameters<ReturnType<typeof useToastController>['dispatchToast']>['1']>,
  'content'
>

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
    & { dismissible?: boolean, body?: ReactNode, footer?: ReactNode }
    | null
    | undefined

export default function useNotifier (toasterId: string) {
  const {
    dispatchToast,
    updateToast,
    dismissToast,
    dismissAllToasts,
  } = useToastController(toasterId)

  const toastCouterRef = useRef(0)
  const genToastId = useCallback(
    () => `${toasterId}__toast${++toastCouterRef.current}`,
    [toasterId],
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
            footer?: ReactNode
          },
        ) => {
          const { dismissible, body, footer, ...rest } = options || {}
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
              {footer && <ToastFooter>{footer}</ToastFooter>}
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
    options?: Omit<NotifyOptions, 'intent'> & {
      dismissible?: boolean
      body?: ReactNode
      footer?: ReactNode
    },
  ) => {
    const { dismissible, body, footer, ...rest } = options || {}
    return notify(
      <Toast>
        <ToastTitle
          media={<Spinner size="extra-tiny" />}
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
    const { title, body, footer, ...rest } = contents.loading
    const toastId = loading(title, { timeout: -1, body, footer, ...rest })

    if (typeof promise === 'function') {
      promise = promise()
    }

    promise.then((value) => {
      const successOptions = typeof contents.success === 'function'
        ? contents.success(value)
        : contents.success

      if (successOptions) {
        const { title, body, footer, ...rest } = successOptions
        success(title, { toastId, body, footer, ...rest })
      } else {
        dismissToast(toastId)
      }

      return value
    }).catch((err) => {
      const errorOptions = typeof contents.error === 'function'
        ? contents.error(err)
        : contents.error

      if (errorOptions) {
        const { title, body, footer, ...rest } = errorOptions
        error(title, { toastId, body, footer, ...rest })
      } else {
        dismissToast(toastId)
      }

      // Re-throw the error so that the caller can handle it
      throw err
    })

    return promise
  }, [dismissToast, error, loading, success])

  return {
    toasterId,
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
