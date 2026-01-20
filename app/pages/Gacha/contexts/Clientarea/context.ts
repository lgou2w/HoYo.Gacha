import { createContext } from 'react'

export enum Clientarea {
  Overview = 'Overview',
  Analysis = 'Analysis',
}

export const Clientareas = Object.values(Clientarea)

export interface ClientareaState {
  readonly active: Clientarea
  change (newVal: Clientarea): void
}

export const ClientareaContext = createContext<ClientareaState | null>(null)

ClientareaContext.displayName = 'ClientareaContext'
