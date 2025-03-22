import React, { ReactNode, useCallback, useMemo } from 'react'
import { useToastController } from '@fluentui/react-components'
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
        (title: ReactNode, options?: Omit<NotifyOptions, 'intent'> & { body?: ReactNode }) => {
          const { body, ...rest } = options || {}
          notify(
            <Toast>
              <ToastTitle>{title}</ToastTitle>
              {body && <ToastBody>{body}</ToastBody>}
            </Toast>,
            {
              ...defaultOptions,
              ...rest,
            },
          )
        }

    return {
      info: createHandler({ intent: 'info', timeout: 3000 }),
      success: createHandler({ intent: 'success', timeout: 3000 }),
      error: createHandler({ intent: 'error', timeout: 5000 }),
      warning: createHandler({ intent: 'warning', timeout: 5000 }),
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

  const promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    contents: {
      loading: [ReactNode, ReactNode?],
      success?: [ReactNode, ReactNode?] | ((value: T) => [ReactNode, ReactNode?])
      error?: [ReactNode, ReactNode?] | ((error: unknown) => [ReactNode, ReactNode?])
    },
  ) => Promise<T> = useCallback((promise, contents) => {
    const [loadingTitle, loadingBody] = contents.loading
    const toastId = loading(loadingTitle, { timeout: -1, body: loadingBody })

    if (typeof promise === 'function') {
      promise = promise()
    }

    promise.then((value) => {
      const successArgs = typeof contents.success === 'function'
        ? contents.success(value)
        : contents.success

      if (successArgs) {
        const [title, body] = successArgs
        success(title, { toastId, body })
      } else {
        dismissToast(toastId)
      }

      return value
    }).catch((err) => {
      const errorArgs = typeof contents.error === 'function'
        ? contents.error(err)
        : contents.error

      if (errorArgs) {
        const [title, body] = errorArgs
        error(title, { toastId, body })
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
  }
}

const genToastId = (() => {
  let id = 0
  return () => {
    return NotifierId + '__toast' + ++id
  }
})()
