import { ParsePathParams } from '@tanstack/react-router'

const Routes = {
  Home: '/',
  Settings: '/Settings',
  Gacha: '/Gacha/$keyofBusinesses',
} as const

type RoutePaths = typeof Routes[keyof typeof Routes]
type RouteParamValue = string | number | boolean | symbol | bigint

export function mergeRouteParams<Route extends RoutePaths> (
  route: Route,
  params: Record<ParsePathParams<Route>, RouteParamValue>,
): string {
  return Object
    .entries<RouteParamValue>(params)
    .reduce<string>(
      (path, [param, value]) =>
        path.replace(
          new RegExp(`\\$${param}`, 'g'),
          typeof value === 'string' ? value : String(value),
        ),
      route,
    )
}

export default Routes
