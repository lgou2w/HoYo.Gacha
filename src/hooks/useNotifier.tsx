import React, { ReactNode, useCallback, useMemo } from 'react'
import { Link, ToastTrigger, useToastController } from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'
import { NotifierId } from '@/components/Layout/declares'
import Spinner from '@/components/UI/Spinner'
import Toast from '@/components/UI/Toast'
import ToastBody from '@/components/UI/ToastBody'
import ToastTitle from '@/components/UI/ToastTitle'

export type NotifyOptions = Omit<NonNullable<Parameters<ReturnType<typeof useToastController>['dispatchToast']>['1']>, 'content'>

export default function useNotifier () {
  const {
    dispatchToast,
    updateToast,
    dismissToast,
    dismissAllToasts,
  } = useToastController(NotifierId)

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
  }, [dispatchToast, updateToast])

  const { info, success, error, warning } = useMemo(() => {
    const createHandler =
      (defaultOptions: NotifyOptions) =>
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
              <ToastTitle
                action={dismissible
                  ? <ToastTrigger>
                      <Link><DismissRegular /></Link>
                    </ToastTrigger>
                  : undefined
                }
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

    const handlerDefaultOptions: NotifyOptions = {
      pauseOnHover: true,
      pauseOnWindowBlur: true,
    }

    return {
      info: createHandler({ intent: 'info', timeout: 3000, ...handlerDefaultOptions }),
      success: createHandler({ intent: 'success', timeout: 3000, ...handlerDefaultOptions }),
      error: createHandler({ intent: 'error', timeout: 5000, ...handlerDefaultOptions }),
      warning: createHandler({ intent: 'warning', timeout: 5000, ...handlerDefaultOptions }),
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
      rest,
    )
  }, [notify])

  type NotifierPromiseContentOptions =
    & { title: ReactNode }
    & Omit<NotifyOptions, 'intent' | 'toastId'>
    & { dismissible?: boolean, body?: ReactNode }
    | null
    | undefined

  const promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    contents: {
      loading: Omit<NonNullable<NotifierPromiseContentOptions>, 'timeout'>,
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

const genToastId = (() => {
  let id = 0
  return () => {
    return NotifierId + '__toast' + ++id
  }
})()
