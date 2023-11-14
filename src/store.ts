import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom'
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disabled by default
      staleTime: 10 * 1000
    }
  }
})

export interface QueryLoaderFunction<
  T = Response | NonNullable<unknown> | null,
  Context = unknown
> {
  (queryClient: QueryClient): (args: LoaderFunctionArgs<Context>) => Promise<T> | T
}

export function useQueryLoaderFunctionData<Fn, T = Fn extends QueryLoaderFunction<infer R> ? R : unknown> (): T {
  return useLoaderData() as T
}
