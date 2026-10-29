import { use } from 'react'
import { useMutation, useSuspenseQueries } from '@tanstack/react-query'
import { KeyofAccountBusiness } from '@/api/Account'
import { accountsQueryOptions, createAccountMutationOptions, selectedAccountUidMutationOptions, selectedAccountUidQueryOptions, updateAccountDataFolderAndPropertiesMutation, updateAccountPropertiesMutation } from './query'
import { AccountContext } from './types'

export function useAccount () {
  const state = use(AccountContext)
  if (!state) {
    throw new Error('useAccount must be used within an AccountProvider')
  } else {
    return state
  }
}

export function useAccountSuspenseQueries (keyof: KeyofAccountBusiness) {
  return useSuspenseQueries({
    queries: [
      accountsQueryOptions(keyof),
      selectedAccountUidQueryOptions(keyof),
    ],
  })
}

export function useCreateAccountMutation () {
  return useMutation(createAccountMutationOptions())
}

export function useUpdateAccountPropertiesMutation () {
  return useMutation(updateAccountPropertiesMutation())
}

export function useUpdateAccountDataFolderAndPropertiesMutation () {
  return useMutation(updateAccountDataFolderAndPropertiesMutation())
}

export function useSelectedAccountUidMutation () {
  return useMutation(selectedAccountUidMutationOptions())
}
