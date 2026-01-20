import { expect, test } from 'vitest'
import { AppErrorMarker, isAppError } from '@/api/error'

test('AppError - isAppError - it is not', () => {
  for (const actual of [
    0,
    1,
    true,
    false,
    null,
    undefined,
    [],
    {},
    { [AppErrorMarker]: true }, // Because there are no name and message fields
  ]) {
    expect(isAppError(actual))
      .toBeFalsy()
  }
})

test('AppError - isAppError', () => {
  expect(isAppError({
    name: 'foo',
    message: 'msg',
    [AppErrorMarker]: true,
  }))
    .toBeTruthy()

  expect(isAppError({
    name: 'bar',
    message: 'msg',
    details: { ext: 'helloworld' },
    [AppErrorMarker]: true,
  }))
    .toBeTruthy()
})
