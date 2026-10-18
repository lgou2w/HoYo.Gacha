import { describe, expect, it } from 'vitest'
import {
  type AppError,
  AppErrorMarker,
  DatabaseErrorKind,
  NamedDatabaseError,
  extractErrorMessage,
  isAppError,
  isAppErrorOfKind,
  isDatabaseError,
} from '@/api/error'

// The backend serializes errors as `{ name, message, details, __HG_ERROR__: true }`.
function makeAppError<N extends string, D extends object | null> (
  name: N,
  details: D,
  message = 'boom',
): AppError<N, D> {
  return {
    name,
    message,
    details,
    [AppErrorMarker]: true,
  } as AppError<N, D>
}

describe('AppErrorMarker', () => {
  it('is the marker the backend puts on every serialized error', () => {
    expect(AppErrorMarker)
      .toBe('__HG_ERROR__')
  })
})

describe('isAppError', () => {
  it('accepts an AppError with object details', () => {
    expect(isAppError(makeAppError('Foo', { kind: 'Bar' })))
      .toBe(true)
  })

  it('accepts an AppError with null details', () => {
    expect(isAppError(makeAppError('Foo', null)))
      .toBe(true)
  })

  it('accepts a payload that survived JSON round-tripping', () => {
    const payload = JSON.parse(JSON.stringify({
      name: 'GachaUrlParseError',
      message: 'Invalid Gacha url',
      details: { kind: 'Invalid' },
      __HG_ERROR__: true,
    }))

    expect(isAppError(payload))
      .toBe(true)
  })

  it('rejects null / undefined / primitives', () => {
    expect(isAppError(null))
      .toBe(false)
    expect(isAppError(undefined))
      .toBe(false)
    expect(isAppError('boom'))
      .toBe(false)
    expect(isAppError(42))
      .toBe(false)
    expect(isAppError(true))
      .toBe(false)
  })

  it('rejects plain objects without the marker', () => {
    expect(isAppError({}))
      .toBe(false)
    expect(isAppError({ name: 'Foo', message: 'bar' }))
      .toBe(false)
    expect(isAppError({ __HG_ERROR__: false }))
      .toBe(false)
    expect(isAppError({ __HG_ERROR__: 'true' }))
      .toBe(false)
  })

  it('rejects marker-only objects (missing name or message)', () => {
    expect(isAppError({ __HG_ERROR__: true }))
      .toBe(false)
    expect(isAppError({ __HG_ERROR__: true, name: 'Foo' }))
      .toBe(false)
    expect(isAppError({ __HG_ERROR__: true, message: 'bar' }))
      .toBe(false)
  })

  it('rejects when name or message is not a string', () => {
    expect(isAppError({ __HG_ERROR__: true, name: 1, message: 'bar' }))
      .toBe(false)
    expect(isAppError({ __HG_ERROR__: true, name: 'Foo', message: 1 }))
      .toBe(false)
  })

  it('rejects a plain Error instance', () => {
    expect(isAppError(new Error('boom')))
      .toBe(false)
  })

  it('does not validate the details field type', () => {
    // The guard only checks marker/name/message; details is opaque here.
    expect(isAppError({ __HG_ERROR__: true, name: 'Foo', message: 'bar', details: 'string' }))
      .toBe(true)
    expect(isAppError({ __HG_ERROR__: true, name: 'Foo', message: 'bar' }))
      .toBe(true)
  })
})

describe('extractErrorMessage', () => {
  it('extracts .message from an Error instance', () => {
    expect(extractErrorMessage(new Error('plain')))
      .toBe('plain')
  })

  it('extracts .message from an AppError', () => {
    expect(extractErrorMessage(makeAppError('Foo', null, 'from backend')))
      .toBe('from backend')
  })

  it('falls back to .message on any object that has one', () => {
    expect(extractErrorMessage({ message: 'shape' }))
      .toBe('shape')
  })

  it('String()s objects with a non-string message', () => {
    expect(extractErrorMessage({ message: 42 }))
      .toBe('42')
    expect(extractErrorMessage({ message: null }))
      .toBe('null')
    expect(extractErrorMessage({ message: '' }))
      .toBe('')
  })

  it('returns strings as-is', () => {
    expect(extractErrorMessage('boom'))
      .toBe('boom')
  })

  it('String()s primitives and null-ish values', () => {
    expect(extractErrorMessage(42))
      .toBe('42')
    expect(extractErrorMessage(true))
      .toBe('true')
    expect(extractErrorMessage(null))
      .toBe('null')
    expect(extractErrorMessage(undefined))
      .toBe('undefined')
  })

  it('String()s objects without a message', () => {
    expect(extractErrorMessage({ foo: 'bar' }))
      .toBe('[object Object]')
  })
})

describe('isAppErrorOfKind', () => {
  const named = 'MyError' as const
  const kind = 'SomeKind' as const

  it('matches name and kind', () => {
    expect(isAppErrorOfKind(makeAppError(named, { kind }), named, kind))
      .toBe(true)
  })

  it('rejects a different kind', () => {
    expect(isAppErrorOfKind(makeAppError(named, { kind: 'Other' }), named, kind))
      .toBe(false)
  })

  it('rejects a different name', () => {
    expect(isAppErrorOfKind(makeAppError('OtherError', { kind }), named, kind))
      .toBe(false)
  })

  it('rejects null details', () => {
    expect(isAppErrorOfKind(makeAppError(named, null), named, kind))
      .toBe(false)
  })

  it('rejects details without kind', () => {
    expect(isAppErrorOfKind(makeAppError(named, { other: 1 }), named, kind))
      .toBe(false)
  })

  it('rejects non-AppError inputs', () => {
    expect(isAppErrorOfKind(new Error('boom'), named, kind))
      .toBe(false)
    expect(isAppErrorOfKind(null, named, kind))
      .toBe(false)
  })
})

describe('isDatabaseError', () => {
  it('accepts a DatabaseError with object details', () => {
    expect(isDatabaseError(makeAppError(NamedDatabaseError, {
      kind: DatabaseErrorKind.Sqlite,
      cause: 'boom',
    })))
      .toBe(true)
  })

  it('accepts a DatabaseError with null details', () => {
    expect(isDatabaseError(makeAppError(NamedDatabaseError, null)))
      .toBe(true)
  })

  it('rejects other names', () => {
    expect(isDatabaseError(makeAppError('GachaFetchError', { kind: 'Metadata' })))
      .toBe(false)
  })

  it('rejects non-AppError inputs', () => {
    expect(isDatabaseError(new Error('boom')))
      .toBe(false)
  })

  it('NamedDatabaseError matches the backend name()', () => {
    expect(NamedDatabaseError)
      .toBe('DatabaseError')
  })

  it('DatabaseErrorKind values match backend details.kind', () => {
    expect(DatabaseErrorKind.Pool)
      .toBe('Pool')
    expect(DatabaseErrorKind.Interact)
      .toBe('Interact')
    expect(DatabaseErrorKind.Sqlite)
      .toBe('Sqlite')
  })
})
