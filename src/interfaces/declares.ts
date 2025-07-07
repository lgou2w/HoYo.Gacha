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

export type SetDifference<A, B> = A extends B ? never : A

export type SetComplement<A, A1 extends A> = SetDifference<A, A1>

// From `T` pick properties that exist in `U`
export type Intersection<T extends object, U extends object> =
  Pick<T, Extract<keyof T, keyof U> & Extract<keyof U, keyof T>>

// From `T` remove properties that exist in `U`
export type Diff<T extends object, U extends object> =
  Pick<T, SetDifference<keyof T, keyof U>>

// From `T` remove properties that exist in `T1` (`T1` has a subset of the properties of `T`)
// eslint-disable-next-line no-use-before-define
export type Subtract<T extends T1, T1 extends object> =
  Pick<T, SetComplement<keyof T, keyof T1>>

// From `U` assign properties to `T` (just like object assign)
export type Assign<
  T extends object,
  U extends object,
  I = Diff<T, U> & Intersection<U, T> & Diff<U, T>
> = Pick<I, keyof I>

// From `U` overwrite properties to `T`
export type Overwrite<
  T extends object,
  U extends object,
  I = Diff<T, U> & Intersection<U, T>
> = Pick<I, keyof I>

export type KeyofUnion<T> = T extends object ? keyof T : never
