import { MutationFunction, MutationKey, queryOptions, useMutation } from '@tanstack/react-query'
import { produce } from 'immer'
import {
  CreateAccountArgs,
  DeleteAccountByBusinessAndUidArgs,
  SqlxDatabaseError,
  SqlxError,
  UpdateAccountDataFolderByBusinessAndUidArgs,
  UpdateAccountPropertiesByBusinessAndUidArgs,
  createAccount,
  deleteAccountByBusinessAndUid,
  deleteKv,
  findAccountsByBusiness,
  findKv,
  updateAccountDataFolderByBusinessAndUid,
  updateAccountGachaUrlByBusinessAndUid,
  updateAccountPropertiesByBusinessAndUid,
  upsertKv,
} from '@/api/commands/database'
import { Account, isSamePrimaryKeyAccount } from '@/interfaces/Account'
import { Business, Businesses, KeyofBusinesses, ReversedBusinesses } from '@/interfaces/Business'
import { OmitParametersFirst } from '@/interfaces/declares'
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
    ...rest,
  ) ?? null
}

function getAccountsData (keyofBusinesses: KeyofBusinesses) {
  return queryClient.getQueryData<Account[]>(accountsKey(keyofBusinesses))
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
      business: Businesses[keyofBusinesses],
    }),
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
        produce((draft = []) => {
          draft.push(data)
        }),
      )
    },
  })
}

function createUpdateAccountFieldMutation<Args, U extends keyof Account> (
  mutationKey: MutationKey,
  mutationFn: MutationFunction<Account | null, Args>,
  field: U,
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
        data && setAccountsData(
          ReversedBusinesses[data.business],
          produce((draft = []) => {
            let index: number
            if ((index = draft.findIndex((el) => isSamePrimaryKeyAccount(el, data))) !== -1) {
              draft[index][field] = data[field]
            }
          }),
        )
      },
    })
  }
}

export const useUpdateAccountDataFolderMutation = createUpdateAccountFieldMutation(
  ['Accounts', 'Update', 'DataFolder'],
  updateAccountDataFolderByBusinessAndUid,
  'dataFolder',
)

export const useUpdateAccountGachaUrlMutation = createUpdateAccountFieldMutation(
  ['Accounts', 'Update', 'GachaUrl'],
  updateAccountGachaUrlByBusinessAndUid,
  'gachaUrl',
)

export const useUpdateAccountPropertiesMutation = createUpdateAccountFieldMutation(
  ['Accounts', 'Update', 'Properties'],
  updateAccountPropertiesByBusinessAndUid,
  'properties',
)

export function useUpdateAccountDataFolderAndPropertiesMutation () {
  const updateAccountDataFolderMutation = useUpdateAccountDataFolderMutation()
  const updateAccountPropertiesMutation = useUpdateAccountPropertiesMutation()
  return useMutation<
    Account | null,
    SqlxError | SqlxDatabaseError | Error,
    UpdateAccountDataFolderByBusinessAndUidArgs & UpdateAccountPropertiesByBusinessAndUidArgs
  >({
    mutationKey: ['Accounts', 'Update', 'DataFolderAndProperties'],
    async mutationFn (args) {
      const { business, uid, dataFolder, properties } = args
      await updateAccountDataFolderMutation.mutateAsync({ business, uid, dataFolder })
      return await updateAccountPropertiesMutation.mutateAsync({ business, uid, properties })
    },
  })
}

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
      data && setAccountsData(
        ReversedBusinesses[data.business],
        produce((draft = []) => {
          let index: number
          if ((index = draft.findIndex((el) => isSamePrimaryKeyAccount(el, data))) !== -1) {
            draft.splice(index, 1)
          }
        }),
      )
    },
  })
}

type SelectedAccountKey = [KeyofBusinesses, 'SelectedAccount']
function selectedAccountKey (keyofBusinesses: KeyofBusinesses): SelectedAccountKey {
  return [keyofBusinesses, 'SelectedAccount']
}

function setSelectedAccountData (
  keyofBusinesses: KeyofBusinesses,
  ...rest: OmitParametersFirst<typeof queryClient.setQueryData<Account | null, SelectedAccountKey>>
) {
  return queryClient.setQueryData<Account | null, SelectedAccountKey>(
    selectedAccountKey(keyofBusinesses),
    ...rest,
  ) ?? null
}

function selectedAccountKvKey (keyofBusinesses: KeyofBusinesses) {
  return `Query:${keyofBusinesses}:SelectedAccount`
}

export function selectedAccountQueryOptions (keyofBusinesses: KeyofBusinesses) {
  return queryOptions<
    Account | null,
    SqlxError | SqlxDatabaseError | Error,
    Account | null,
    SelectedAccountKey
  >({
    staleTime: Infinity,
    queryKey: selectedAccountKey(keyofBusinesses),
    async queryFn ({ queryKey }) {
      const [keyofBusinesses] = queryKey
      const data = await findKv({
        key: selectedAccountKvKey(keyofBusinesses),
      })

      return (data && getAccountsData(keyofBusinesses)
        ?.find((el) => el.uid === +data.val)) ?? null
    },
  })
}

const SetSelectedAccountKey = ['SelectedAccount', 'Set']

export interface SetSelectedAccountArgs<T extends Business> {
  business: T
  data: Account<T> | null
}

export function useSetSelectedAccountMutation<T extends Business> () {
  return useMutation<
    Account<T> | null,
    SqlxError | SqlxDatabaseError | Error,
    SetSelectedAccountArgs<T>
  >({
    mutationKey: SetSelectedAccountKey,
    async mutationFn (args) {
      const keyofBusinesses = ReversedBusinesses[args.business]

      if (args.data) {
        const existed = getAccountsData?.(keyofBusinesses)?.find((el) => isSamePrimaryKeyAccount(el, args.data!))

        if (!existed) {
          console.warn('The selected account %o does not exist in the accounts list', args.data)
          return null
        }

        await upsertKv({
          key: selectedAccountKvKey(keyofBusinesses),
          val: String(existed.uid),
        })

        return existed as Account<T>
      } else {
        await deleteKv({ key: selectedAccountKvKey(keyofBusinesses) })
        return null
      }
    },
    onSuccess (data, args) {
      setSelectedAccountData(ReversedBusinesses[args.business], data)
    },
  })
}
