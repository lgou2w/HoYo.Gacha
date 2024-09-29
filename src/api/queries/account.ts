import { MutationFunction, MutationKey, queryOptions, useMutation } from '@tanstack/react-query'
import { produce } from 'immer'
import {
  CreateAccountArgs,
  DeleteAccountByBusinessAndUidArgs,
  SqlxDatabaseError,
  SqlxError,
  createAccount,
  deleteAccountByBusinessAndUid,
  findAccountsByBusiness,
  updateAccountDataFolderByBusinessAndUid,
  updateAccountGachaUrlByBusinessAndUid,
  updateAccountPropertiesByBusinessAndUid
} from '@/api/commands/database'
import { Account, isSamePrimaryKeyAccount } from '@/interfaces/Account'
import { Businesses, KeyofBusinesses, ReversedBusinesses } from '@/interfaces/Business'
import { OmitParametersFirst } from '@/interfaces/Declare'
import queryClient from '@/queryClient'

type AccountsKey = [KeyofBusinesses, 'Accounts']
function accountsKey (keyofBusinesses: KeyofBusinesses): AccountsKey {
  return [keyofBusinesses, 'Accounts']
}

function setAccountsData (
  keyofBusinesses: KeyofBusinesses,
  ...rest: OmitParametersFirst<typeof queryClient.setQueryData<Account[], AccountsKey>>
) {
  return queryClient.setQueryData<Account[], AccountsKey>(
    accountsKey(keyofBusinesses),
    ...rest
  )
}

export function accountsQueryOptions (keyofBusinesses: KeyofBusinesses) {
  return queryOptions<
    Account[],
    SqlxError | SqlxDatabaseError | Error,
    Account[],
    AccountsKey
  >({
    staleTime: Infinity,
    queryKey: accountsKey(keyofBusinesses),
    queryFn: () => findAccountsByBusiness({
      business: Businesses[keyofBusinesses]
    })
  })
}

const CreateAccountKey = ['Accounts', 'Create']
export function useCreateAccountMutation () {
  return useMutation<
    Account,
    SqlxError | SqlxDatabaseError | Error,
    CreateAccountArgs
  >({
    mutationKey: CreateAccountKey,
    mutationFn: createAccount,
    onSuccess (data) {
      setAccountsData(
        ReversedBusinesses[data.business],
        (prev) => {
          return produce(prev || [], (draft) => {
            draft.push(data)
          })
        }
      )
    }
  })
}

function createUpdateAccountFieldMutation<Args, U extends keyof Account> (
  mutationKey: MutationKey,
  mutationFn: MutationFunction<Account | null, Args>,
  field: U
) {
  return () => {
    return useMutation<
      Account | null,
      SqlxError | SqlxDatabaseError | Error,
      Args
    >({
      mutationKey,
      mutationFn,
      onSuccess (data) {
        if (data) {
          setAccountsData(
            ReversedBusinesses[data.business],
            (prev) => {
              return prev && produce(prev, (draft) => {
                let index: number
                if ((index = draft.findIndex((el) => isSamePrimaryKeyAccount(el, data))) !== -1) {
                  draft[index][field] = data[field]
                }
              })
            }
          )
        }
      }
    })
  }
}

export const useUpdateAccountDataFolderMutation = createUpdateAccountFieldMutation(
  ['Accounts', 'Update', 'DataFolder'],
  updateAccountDataFolderByBusinessAndUid,
  'dataFolder'
)

export const useUpdateAccountGachaUrlMutation = createUpdateAccountFieldMutation(
  ['Accounts', 'Update', 'GachaUrl'],
  updateAccountGachaUrlByBusinessAndUid,
  'gachaUrl'
)

export const useUpdateAccountPropertiesMutation = createUpdateAccountFieldMutation(
  ['Accounts', 'Update', 'Properties'],
  updateAccountPropertiesByBusinessAndUid,
  'properties'
)

const DeleteAccountKey = ['Accounts', 'Delete']
export function useDeleteAccountMutation () {
  return useMutation<
    Account | null,
    SqlxError | SqlxDatabaseError | Error,
    DeleteAccountByBusinessAndUidArgs
  >({
    mutationKey: DeleteAccountKey,
    mutationFn: deleteAccountByBusinessAndUid,
    onSuccess (data) {
      if (data) {
        setAccountsData(
          ReversedBusinesses[data.business],
          (prev) => {
            return prev && produce(prev, (draft) => {
              let index: number
              if ((index = draft.findIndex((el) => isSamePrimaryKeyAccount(el, data))) !== -1) {
                draft.splice(index, 1)
              }
            })
          }
        )
      }
    }
  })
}
