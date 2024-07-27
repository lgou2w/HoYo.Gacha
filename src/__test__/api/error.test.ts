import { Marker, isDetailedError } from '@/api/error'

test('DetailedError - isDetailedError - it is not', () => {
  for (const actual of [
    0,
    1,
    true,
    false,
    null,
    undefined,
    [],
    {},
    { [Marker]: true } // Because there are no name and message fields
  ]) {
    expect(isDetailedError(actual))
      .toBeFalsy()
  }
})

test('DetailedError - isDetailedError', () => {
  expect(isDetailedError({
    name: 'foo',
    message: 'msg',
    [Marker]: true
  }))
    .toBeTruthy()

  expect(isDetailedError({
    name: 'bar',
    message: 'msg',
    details: { ext: 'helloworld' },
    [Marker]: true
  }))
    .toBeTruthy()
})
