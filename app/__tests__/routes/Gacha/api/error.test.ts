import { describe, expect, it } from 'vitest'
import { type AppError, AppErrorMarker } from '@/api/error'
import {
  GachaFetchErrorKind,
  GachaUrlFindErrorKind,
  GachaUrlParseErrorKind,
  GachaUrlRequestErrorKind,
  GachaUrlValidationErrorKind,
  NamedGachaFetchError,
  NamedGachaUrlFindError,
  NamedGachaUrlParseError,
  NamedGachaUrlRequestError,
  NamedGachaUrlValidationError,
  isGachaFetchError,
  isGachaUrlAuthkeyTimeout,
  isGachaUrlFindError,
  isGachaUrlParseError,
  isGachaUrlRequestError,
  isGachaUrlValidationError,
} from '@/routes/Gacha/api/error'

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

describe('Named* constants (serialization contract with the backend)', () => {
  it('NamedGachaUrlFindError', () => {
    expect(NamedGachaUrlFindError)
      .toBe('GachaUrlFindError')
  })

  it('NamedGachaUrlParseError', () => {
    expect(NamedGachaUrlParseError)
      .toBe('GachaUrlParseError')
  })

  it('NamedGachaUrlRequestError', () => {
    expect(NamedGachaUrlRequestError)
      .toBe('GachaUrlRequestError')
  })

  it('NamedGachaUrlValidationError', () => {
    expect(NamedGachaUrlValidationError)
      .toBe('GachaUrlValidationError')
  })

  it('NamedGachaFetchError', () => {
    expect(NamedGachaFetchError)
      .toBe('GachaFetchError')
  })
})

describe('*Kind enums (serialization contract with backend details.kind)', () => {
  it('GachaUrlFindErrorKind', () => {
    expect(GachaUrlFindErrorKind.OpenDiskCache)
      .toBe('OpenDiskCache')
    expect(GachaUrlFindErrorKind.ReadDiskCache)
      .toBe('ReadDiskCache')
    expect(GachaUrlFindErrorKind.OpenWebcaches)
      .toBe('OpenWebcaches')
    expect(GachaUrlFindErrorKind.EmptyWebCaches)
      .toBe('EmptyWebCaches')
  })

  it('GachaUrlParseErrorKind', () => {
    expect(GachaUrlParseErrorKind.Invalid)
      .toBe('Invalid')
    expect(GachaUrlParseErrorKind.MissingParam)
      .toBe('MissingParam')
    expect(GachaUrlParseErrorKind.UnsupportedGamebiz)
      .toBe('UnsupportedGamebiz')
  })

  it('GachaUrlRequestErrorKind', () => {
    expect(GachaUrlRequestErrorKind.UnsupportedEndpoint)
      .toBe('UnsupportedEndpoint')
    expect(GachaUrlRequestErrorKind.Reqwest)
      .toBe('Reqwest')
    expect(GachaUrlRequestErrorKind.AuthkeyTimeout)
      .toBe('AuthkeyTimeout')
    expect(GachaUrlRequestErrorKind.VisitTooFrequently)
      .toBe('VisitTooFrequently')
    expect(GachaUrlRequestErrorKind.UnexpectedResponse)
      .toBe('UnexpectedResponse')
    expect(GachaUrlRequestErrorKind.ReachedMaxAttempts)
      .toBe('ReachedMaxAttempts')
  })

  it('GachaUrlValidationErrorKind', () => {
    expect(GachaUrlValidationErrorKind.InconsistentGamebiz)
      .toBe('InconsistentGamebiz')
    expect(GachaUrlValidationErrorKind.EmptyData)
      .toBe('EmptyData')
    expect(GachaUrlValidationErrorKind.NotFound)
      .toBe('NotFound')
    expect(GachaUrlValidationErrorKind.InconsistentUid)
      .toBe('InconsistentUid')
  })

  it('GachaFetchErrorKind', () => {
    expect(GachaFetchErrorKind.InvalidUid)
      .toBe('InvalidUid')
    expect(GachaFetchErrorKind.InconsistentUid)
      .toBe('InconsistentUid')
    expect(GachaFetchErrorKind.Metadata)
      .toBe('Metadata')
  })
})

describe('isGachaUrlFindError', () => {
  it('accepts each variant', () => {
    expect(isGachaUrlFindError(makeAppError(NamedGachaUrlFindError, {
      kind: GachaUrlFindErrorKind.EmptyWebCaches,
    })))
      .toBe(true)

    expect(isGachaUrlFindError(makeAppError(NamedGachaUrlFindError, {
      kind: GachaUrlFindErrorKind.OpenDiskCache,
      cause: { kind: 'NotFound', message: 'x' },
    })))
      .toBe(true)
  })

  it('rejects other names', () => {
    expect(isGachaUrlFindError(makeAppError(NamedGachaUrlParseError, {
      kind: GachaUrlParseErrorKind.Invalid,
    })))
      .toBe(false)
  })

  it('rejects non-AppError inputs', () => {
    expect(isGachaUrlFindError(new Error('boom')))
      .toBe(false)
    expect(isGachaUrlFindError(null))
      .toBe(false)
  })
})

describe('isGachaUrlParseError', () => {
  it('accepts each variant', () => {
    expect(isGachaUrlParseError(makeAppError(NamedGachaUrlParseError, {
      kind: GachaUrlParseErrorKind.Invalid,
    })))
      .toBe(true)

    expect(isGachaUrlParseError(makeAppError(NamedGachaUrlParseError, {
      kind: GachaUrlParseErrorKind.MissingParam,
      name: 'authkey',
    })))
      .toBe(true)

    expect(isGachaUrlParseError(makeAppError(NamedGachaUrlParseError, {
      kind: GachaUrlParseErrorKind.UnsupportedGamebiz,
      value: 'xxx',
    })))
      .toBe(true)
  })

  it('rejects other names', () => {
    expect(isGachaUrlParseError(makeAppError(NamedGachaUrlFindError, {
      kind: GachaUrlFindErrorKind.EmptyWebCaches,
    })))
      .toBe(false)
  })
})

describe('isGachaUrlRequestError', () => {
  it('accepts each variant', () => {
    const cases = [
      { kind: GachaUrlRequestErrorKind.UnsupportedEndpoint, gamebiz: 'hk4e_cn', endpoint: 'Standard' },
      { kind: GachaUrlRequestErrorKind.Reqwest, cause: 'boom' },
      { kind: GachaUrlRequestErrorKind.AuthkeyTimeout },
      { kind: GachaUrlRequestErrorKind.VisitTooFrequently },
      { kind: GachaUrlRequestErrorKind.UnexpectedResponse, retcode: -1, message: 'x' },
      { kind: GachaUrlRequestErrorKind.ReachedMaxAttempts },
    ]

    for (const details of cases) {
      expect(isGachaUrlRequestError(makeAppError(NamedGachaUrlRequestError, details)))
        .toBe(true)
    }
  })

  it('rejects other names', () => {
    expect(isGachaUrlRequestError(makeAppError(NamedGachaUrlValidationError, {
      kind: GachaUrlValidationErrorKind.NotFound,
    })))
      .toBe(false)
  })
})

describe('isGachaUrlAuthkeyTimeout', () => {
  it('accepts AuthkeyTimeout', () => {
    expect(isGachaUrlAuthkeyTimeout(makeAppError(NamedGachaUrlRequestError, {
      kind: GachaUrlRequestErrorKind.AuthkeyTimeout,
    })))
      .toBe(true)
  })

  it('rejects other kinds under the same name', () => {
    expect(isGachaUrlAuthkeyTimeout(makeAppError(NamedGachaUrlRequestError, {
      kind: GachaUrlRequestErrorKind.VisitTooFrequently,
    })))
      .toBe(false)

    expect(isGachaUrlAuthkeyTimeout(makeAppError(NamedGachaUrlRequestError, {
      kind: GachaUrlRequestErrorKind.UnexpectedResponse,
      retcode: -101,
      message: 'authkey timeout',
    })))
      .toBe(false)
  })

  it('rejects the same kind under a different name', () => {
    expect(isGachaUrlAuthkeyTimeout(makeAppError(NamedGachaUrlFindError, {
      kind: GachaUrlRequestErrorKind.AuthkeyTimeout,
    })))
      .toBe(false)
  })

  it('rejects null details', () => {
    expect(isGachaUrlAuthkeyTimeout(makeAppError(NamedGachaUrlRequestError, null)))
      .toBe(false)
  })

  it('rejects non-AppError inputs', () => {
    expect(isGachaUrlAuthkeyTimeout(new Error('boom')))
      .toBe(false)
    expect(isGachaUrlAuthkeyTimeout(null))
      .toBe(false)
  })
})

describe('isGachaUrlValidationError', () => {
  it('accepts each variant', () => {
    expect(isGachaUrlValidationError(makeAppError(NamedGachaUrlValidationError, {
      kind: GachaUrlValidationErrorKind.InconsistentGamebiz,
      expected: 'hk4e_cn',
      actual: 'hkrpg_cn',
      region: null,
    })))
      .toBe(true)

    expect(isGachaUrlValidationError(makeAppError(NamedGachaUrlValidationError, {
      kind: GachaUrlValidationErrorKind.EmptyData,
    })))
      .toBe(true)

    expect(isGachaUrlValidationError(makeAppError(NamedGachaUrlValidationError, {
      kind: GachaUrlValidationErrorKind.NotFound,
    })))
      .toBe(true)

    expect(isGachaUrlValidationError(makeAppError(NamedGachaUrlValidationError, {
      kind: GachaUrlValidationErrorKind.InconsistentUid,
      expected: 100_000_000,
      actuals: [100_000_001],
    })))
      .toBe(true)
  })

  it('rejects other names', () => {
    expect(isGachaUrlValidationError(makeAppError(NamedGachaUrlRequestError, {
      kind: GachaUrlRequestErrorKind.AuthkeyTimeout,
    })))
      .toBe(false)
  })
})

describe('isGachaFetchError', () => {
  it('accepts each variant', () => {
    expect(isGachaFetchError(makeAppError(NamedGachaFetchError, {
      kind: GachaFetchErrorKind.InvalidUid,
      business: 0,
      value: 100_000_000,
    })))
      .toBe(true)

    expect(isGachaFetchError(makeAppError(NamedGachaFetchError, {
      kind: GachaFetchErrorKind.InconsistentUid,
      expected: 100_000_000,
      actual: 100_000_001,
    })))
      .toBe(true)

    expect(isGachaFetchError(makeAppError(NamedGachaFetchError, {
      kind: GachaFetchErrorKind.Metadata,
      business: 0,
      lang: 'en-us',
      itemName: 'Foo',
    })))
      .toBe(true)
  })

  it('only recognizes the GachaFetchError name, not its union members', () => {
    // GachaFetchError is a union:
    //   GachaUrlParseError | GachaUrlRequestError | DatabaseError
    //   | AppError<NamedGachaFetchError, ...>
    // The guard narrows only the AppError<NamedGachaFetchError, ...> branch;
    // callers must dispatch to the appropriate guard for the other branches.
    expect(isGachaFetchError(makeAppError(NamedGachaUrlParseError, {
      kind: GachaUrlParseErrorKind.Invalid,
    })))
      .toBe(false)

    expect(isGachaFetchError(makeAppError(NamedGachaUrlRequestError, {
      kind: GachaUrlRequestErrorKind.AuthkeyTimeout,
    })))
      .toBe(false)

    expect(isGachaFetchError(makeAppError('DatabaseError', null)))
      .toBe(false)
  })

  it('rejects non-AppError inputs', () => {
    expect(isGachaFetchError(new Error('boom')))
      .toBe(false)
  })
})

describe('guards do not cross-match', () => {
  const error = makeAppError('SomeOtherError', { kind: 'SomeKind' })

  it('isGachaUrlFindError', () => {
    expect(isGachaUrlFindError(error))
      .toBe(false)
  })

  it('isGachaUrlParseError', () => {
    expect(isGachaUrlParseError(error))
      .toBe(false)
  })

  it('isGachaUrlRequestError', () => {
    expect(isGachaUrlRequestError(error))
      .toBe(false)
  })

  it('isGachaUrlValidationError', () => {
    expect(isGachaUrlValidationError(error))
      .toBe(false)
  })

  it('isGachaFetchError', () => {
    expect(isGachaFetchError(error))
      .toBe(false)
  })
})
