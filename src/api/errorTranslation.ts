import { UseI18nResponse } from '@/components/Locale'
import { Business, ReversedBusinesses } from '@/interfaces/Business'
import { DetailedError, extractErrorMessage, isDetailedError } from './error'

export default function errorTranslation (
  i18n: UseI18nResponse,
  error: unknown,
): string {
  if (isDetailedError(error)) {
    const { name, message, details } = error as DetailedError<string, object | null>

    let options: Record<string, unknown>
    let key: string

    if (details && typeof details === 'object' && 'kind' in details) {
      const { kind, ...rest } = details
      key = `Errors.${name}.${String(kind)}`
      options = rest
    } else {
      key = `Errors.${name}`
      options = { message }
    }

    // HACK: Translate the value Business to KeyofBusinesses
    if ('business' in options && typeof options.business === 'number') {
      const keyofBusinesses = ReversedBusinesses[options.business as Business]
      options.business = keyofBusinesses
    }

    return i18n.t(key, options)
  }

  const message = extractErrorMessage(error)
  const translation = i18n.t('Errors.Unexpected', { message })

  if (error instanceof Error || (error && typeof error === 'object' && 'name' in error)) {
    return translation + ' (' + String(error.name) + ')'
  } else {
    return translation
  }
}
