export type OmitParametersFirst<T extends (...args: never[]) => unknown> =
  T extends (...args: infer P) => unknown
    ? P extends [unknown, ...infer R]
      ? R
      : P
    : never

export type PickParametersFirst<T extends (...args: never[]) => unknown> =
  T extends (...args: infer P) => unknown
    ? P[0]
    : never
