import { createContext } from 'react'

export enum Clientarea {
  Overview = 'Overview',
  Analysis = 'Analysis',
  Chart = 'Chart',
}

export const Clientareas = Object.values(Clientarea)

export function isClientarea (val: unknown): val is Clientarea {
  return typeof val === 'string'
    && (Clientareas as string[]).includes(val)
}

export interface ClientareaContextValue {
  readonly active: Clientarea
  change (newVal: Clientarea): Promise<Clientarea>
}

export const ClientareaContext = createContext<ClientareaContextValue | null>(null)
ClientareaContext.displayName = 'ClientareaContext'
