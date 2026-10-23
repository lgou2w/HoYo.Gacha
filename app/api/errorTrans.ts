import { AppError, extractErrorMessage, isAppError } from '@/api/error'
import { UseI18n } from '@/i18n'

/**
 * Translate a backend `AppError` (or any error) into a user-facing string.
 *
 * Backend errors serialize as `{ name, message, details, __HG_ERROR__ }`.
 * `name` maps to a top-level key under the `Error` namespace. When `details`
 * carries a string `kind`, it extends the key to `Error:<name>.<kind>` and
 * the remaining `details` fields become interpolation parameters (e.g.
 * `Error:GachaUrlParseError.MissingParam` renders with `{ name: "authkey" }`).
 *
 * `details` may include `keyof` (a `KeyofAccountBusiness` string) when the
 * backend wants the message to name a game (`$t(Common:{{keyof}}.Name)`).
 * The backend emits this directly — no frontend normalization needed.
 *
 * Fallback chain when a translation is missing (new backend variant not yet
 * translated):
 *
 *   Error:<name>.<kind>  →  Error:<name>  →  Error:Unexpected
 *
 * i18next returns the raw key when a translation is absent, so comparing the
 * return value against the key is a reliable "exists" check without holding
 * an `i18n` instance.
 *
 * # `t` must be **scope-free**
 *
 * This function builds fully-qualified keys (`Error:<name>.<kind>`) that
 * already carry their namespace. Passing a `t` bound to a `scope` (e.g.
 * `useI18n({ ns: GachaPage, scope: 'Foo.Bar' })`) would
 * prefix every key with `Foo.Bar.`, so `Error:GachaUrlParseError.Invalid`
 * becomes `Foo.Bar.Error:GachaUrlParseError.Invalid` — which
 * no locale defines, and the user sees the raw key.
 *
 * Call sites therefore do one of:
 *
 * ```ts
 * // Option A: get an unscoped `t` and prefix the caller's own scope manually.
 * const I18nScope = 'Foo.Bar'
 * const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
 * t(`${I18nScope}.Hello`, { keyof })
 * errorTrans(t, error)  // `t` is scope-free, keys land in `Error:*`
 *
 * // Option B: destructure `t` from a hook that never sets `scope`.
 * const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
 * ```
 *
 * `useI18n({ scope })` is still fine for *ordinary* keys — just don't hand
 * the scoped `t` to `errorTrans`. Keep a second unscoped `t` around if you
 * need both in the same component.
 */
export default function errorTrans (
  t: UseI18n['t'],
  error: unknown,
): string {
  if (isAppError(error)) {
    return translateAppError(t, error)
  }

  const message = extractErrorMessage(error)
  const fallback = t('Error:Unexpected', { message })

  if (error instanceof Error || (error && typeof error === 'object' && 'name' in error)) {
    return `${fallback} (${String(error.name)})`
  }

  return fallback
}

/**
 * Internal: translate an `AppError`-shaped value.
 *
 * Exported so the fallback chain can be unit-tested without spinning up
 * React or an i18n instance — pass a fake `t` that returns either the
 * translated string or the raw key.
 *
 * Caller is expected to pass a scope-free `t`; see [`errorTrans`] for why.
 */
export function translateAppError (t: UseI18n['t'], error: AppError<string, object | null>): string {
  const { name, message, details } = error

  // No `kind` (absent or null): translate by `name` alone.
  if (!details || !('kind' in details) || typeof details.kind !== 'string') {
    return t(`Error:${name}`, { message })
  }

  const { kind, ...rest } = details
  const key = `Error:${name}.${kind}`

  const translated = t(key, rest)
  if (translated !== key) {
    return translated
  }

  const fallback = t(`Error:${name}`, { ...rest, message })
  if (fallback !== `Error:${name}`) {
    return fallback
  }

  return t('Error:Unexpected', { message })
}
