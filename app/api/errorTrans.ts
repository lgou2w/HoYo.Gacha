import { TFunction } from 'i18next'
import { extractErrorMessage, isAppError } from './error'
import { AccountBusiness } from './schemas/Account'

export default function errorTrans (
  t: TFunction,
  error: unknown,
): string {
  if (isAppError(error)) {
    const { name, message, details } = error

    let key: string
    let options: Record<string, unknown>

    if (details && typeof details === 'object' && 'kind' in details) {
      const { kind, ...rest } = details
      key = `${name}.${String(kind)}`
      options = rest
    } else {
      key = name
      options = { message }
    }

    if ('business' in options && typeof options.business === 'number') {
      const keyof = AccountBusiness[options.business]
      delete options.business
      options.keyof = keyof
    }

    return t(`Error:${key}`, options)
  }

  const message = extractErrorMessage(error)
  const trans = t('Error:Unexpected', { message })

  if (error instanceof Error || (error && typeof error === 'object' && 'name' in error)) {
    return `${trans} (${String(error.name)})`
  } else {
    return trans
  }
}
