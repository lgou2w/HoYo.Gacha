import { use } from 'react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { clientareaPreferenceMutationOptions, clientareaPreferenceQueryOptions } from './query'
import { ClientareaContext } from './types'

export function useClientarea () {
  const state = use(ClientareaContext)
  if (!state) {
    throw new Error('useClientarea must be used within an ClientareaProvider')
  } else {
    return state
  }
}

export function useClientareaPreferenceSuspenseQuery () {
  return useSuspenseQuery(clientareaPreferenceQueryOptions())
}

export function useClientareaPreferenceMutation () {
  return useMutation(clientareaPreferenceMutationOptions())
}
