import { LoaderFunctionArgs, defer as _defer, useLoaderData } from 'react-router-dom'
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false // Disabled by default
    }
  }
})

export type DeferredData<Data = Record<string, unknown>> = ReturnType<typeof _defer> & { data: Data }
export function defer<Data extends Record<string, unknown>> (data: Data): DeferredData<Data> {
  return _defer(data) as DeferredData<Data>
}

export interface QueryLoaderFunction<T = DeferredData | Response | NonNullable<unknown> | null> {
  (queryClient: QueryClient): (args: LoaderFunctionArgs) => Promise<T> | T
}

export function useQueryLoaderFunctionData<
  Fn,
  T = Fn extends QueryLoaderFunction<infer R>
    ? R extends DeferredData<infer Data> ? Data : R
    : unknown
> (): T {
  return useLoaderData() as T
}
