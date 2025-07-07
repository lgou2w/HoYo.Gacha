import { MutationFunction, MutationKey, queryOptions, useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
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
  updateAccountPropertiesByBusinessAndUid,
  upsertKv,
} from '@/api/commands/database'
import { Account, isSamePrimaryKeyAccount } from '@/interfaces/Account'
import { Business, Businesses, KeyofBusinesses, ReversedBusinesses } from '@/interfaces/Business'
import { OmitParametersFirst } from '@/interfaces/declares'
import queryClient from '@/queryClient'

// #region: Accounts

export type Accounts = Account[]

const KeyAccounts = 'Accounts'

export function accountsQueryKey (keyofBusinesses: KeyofBusinesses) {
  return [keyofBusinesses, KeyAccounts] as const
}

export type AccountsQueryKey = ReturnType<typeof accountsQueryKey>

export function getAccountsQueryData (keyofBusinesses: KeyofBusinesses) {
  return queryClient.getQueryData<Accounts>(accountsQueryKey(keyofBusinesses)) ?? null
}

export function setAccountsQueryData (
  keyofBusinesses: KeyofBusinesses,
  ...rest: OmitParametersFirst<typeof queryClient.setQueryData<Account[], AccountsQueryKey>>
) {
  return queryClient.setQueryData<Accounts, AccountsQueryKey>(
    accountsQueryKey(keyofBusinesses),
    ...rest,
  ) ?? null
}

export function accountsQueryOptions (keyofBusinesses: KeyofBusinesses) {
  return queryOptions<
    Accounts,
    SqlxError | SqlxDatabaseError | Error,
    Accounts,
    AccountsQueryKey
  >({
    staleTime: Infinity,
    queryKey: accountsQueryKey(keyofBusinesses),
    queryFn: async function accountsQueryFn () {
      const business = Businesses[keyofBusinesses]
      const accounts = await findAccountsByBusiness({ business })
      await SelectedAccountUidStorage.inspect(keyofBusinesses, accounts)
      return accounts
    },
    retry: false,
  })
}

export function useAccountsQuery (keyofBusinesses: KeyofBusinesses) {
  return useQuery(accountsQueryOptions(keyofBusinesses))
}

export function useAccountsSuspenseQuery (keyofBusinesses: KeyofBusinesses) {
  return useSuspenseQuery(accountsQueryOptions(keyofBusinesses))
}

export function useAccountsSuspenseQueryData (keyofBusinesses: KeyofBusinesses) {
  return useAccountsSuspenseQuery(keyofBusinesses)
    .data
}

export function ensureAccountsQueryData (keyofBusinesses: KeyofBusinesses) {
  return queryClient.ensureQueryData(accountsQueryOptions(keyofBusinesses))
}

// Mutation

export function useCreateAccountMutation () {
  return useMutation<
    Account,
    SqlxError | SqlxDatabaseError | Error,
    CreateAccountArgs
  >({
    mutationKey: [KeyAccounts, 'Create'],
    mutationFn: createAccount,
    async onSuccess (data) {
      const keyofBusinesses = ReversedBusinesses[data.business]

      setAccountsQueryData(
        keyofBusinesses,
        produce((draft = []) => {
          draft.push(data)
        }),
      )

      // After the creation is complete, select the account
      // and invalidate the query cache for selected account
      await SelectedAccountUidStorage.save(keyofBusinesses, data.uid)
      await invalidateSelectedAccountUidQuery(keyofBusinesses)
    },
  })
}

function updateAccountsQueryDataElementFields<U extends keyof Account> (
  fields: U[],
  update: Account | null,
) {
  update && setAccountsQueryData(
    ReversedBusinesses[update.business],
    produce((draft = []) => {
      let index: number
      if ((index = draft.findIndex((el) => isSamePrimaryKeyAccount(el, update))) !== -1) {
        for (const field of fields) {
          draft[index][field] = update[field]
        }
      }
    }),
  )
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
        updateAccountsQueryDataElementFields([field], data)
      },
    })
  }
}

export const useUpdateAccountDataFolderMutation = createUpdateAccountFieldMutation(
  [KeyAccounts, 'Update', 'DataFolder'],
  updateAccountDataFolderByBusinessAndUid,
  'dataFolder',
)

export const useUpdateAccountPropertiesMutation = createUpdateAccountFieldMutation(
  [KeyAccounts, 'Update', 'Properties'],
  updateAccountPropertiesByBusinessAndUid,
  'properties',
)

export function useUpdateAccountDataFolderAndPropertiesMutation () {
  return useMutation<
    Account | null,
    SqlxError | SqlxDatabaseError | Error,
    UpdateAccountDataFolderByBusinessAndUidArgs & UpdateAccountPropertiesByBusinessAndUidArgs
  >({
    mutationKey: [KeyAccounts, 'Update', 'DataFolderAndProperties'],
    async mutationFn (args) {
      const { business, uid, dataFolder, properties } = args
      await updateAccountDataFolderByBusinessAndUid({ business, uid, dataFolder })
      return await updateAccountPropertiesByBusinessAndUid({ business, uid, properties })
    },
    onSuccess (data) {
      updateAccountsQueryDataElementFields(['dataFolder', 'properties'], data)
    },
  })
}

export function useDeleteAccountMutation () {
  return useMutation<
    Account | null,
    SqlxError | SqlxDatabaseError | Error,
    DeleteAccountByBusinessAndUidArgs
  >({
    mutationKey: [KeyAccounts, 'Delete'],
    mutationFn: deleteAccountByBusinessAndUid,
    async onSuccess (data) {
      if (!data) return

      const keyofBusinesses = ReversedBusinesses[data.business]
      const accounts = setAccountsQueryData(
        keyofBusinesses,
        produce((draft = []) => {
          let index: number
          if ((index = draft.findIndex((el) => isSamePrimaryKeyAccount(el, data))) !== -1) {
            draft.splice(index, 1)
          }
        }),
      )

      // If the deleted account was selected, delete the selected account uid
      if (accounts) {
        await SelectedAccountUidStorage.inspect(keyofBusinesses, accounts)
        await invalidateSelectedAccountUidQuery(keyofBusinesses)
      }
    },
  })
}

// #endregion

// #region: Selected Account Uid

const SelectedAccountUidStorage = Object.freeze({
  databaseKey (keyofBusinesses: KeyofBusinesses) {
    return `Query:${keyofBusinesses}:SelectedAccountUid` as const
  },
  async load (keyofBusinesses: KeyofBusinesses): Promise<Account['uid'] | null> {
    const kv = await findKv({
      key: this.databaseKey(keyofBusinesses),
    })
    return kv ? +kv.val : null
  },
  async save (keyofBusinesses: KeyofBusinesses, uid: Account['uid']) {
    await upsertKv({
      key: this.databaseKey(keyofBusinesses),
      val: String(uid),
    })
  },
  async delete (keyofBusinesses: KeyofBusinesses) {
    await deleteKv({
      key: this.databaseKey(keyofBusinesses),
    })
  },
  async inspect (keyofBusinesses: KeyofBusinesses, accounts: Accounts) {
    let selected = await this.load(keyofBusinesses)
    if (selected) {
      const existed = accounts.find((el) => el.uid === selected)
      if (!existed) {
        console.warn('The selected account %o does not exist in the %s accounts list', selected, keyofBusinesses)
        await this.delete(keyofBusinesses)
        selected = null
      }
    }

    if (!selected) {
      const firstAccount = accounts[0] ?? null
      if (firstAccount) {
        console.warn('Auto-selecting first account %o for %s', firstAccount, keyofBusinesses)
        await this.save(keyofBusinesses, firstAccount.uid)
      }
    }
  },
})

const KeySelectedAccountUid = 'SelectedAccountUid'

export function selectedAccountUidQueryKey (keyofBusinesses: KeyofBusinesses) {
  return [keyofBusinesses, KeyAccounts, KeySelectedAccountUid] as const
}

export type SelectedAccountUidQueryKey = ReturnType<typeof selectedAccountUidQueryKey>

export function selectedAccountUidQueryOptions (keyofBusinesses: KeyofBusinesses) {
  return queryOptions<
    Account['uid'] | null,
    SqlxError | SqlxDatabaseError | Error,
    Account['uid'] | null,
    SelectedAccountUidQueryKey
  >({
    gcTime: Infinity, // Don't gc this data, cache it permanently
    staleTime: Infinity,
    queryKey: selectedAccountUidQueryKey(keyofBusinesses),
    queryFn: async function selectedAccountUidQueryFn () {
      return SelectedAccountUidStorage.load(keyofBusinesses)
    },
    retry: false,
  })
}

export function useSelectedAccountUidQuery (keyofBusinesses: KeyofBusinesses) {
  return useQuery(selectedAccountUidQueryOptions(keyofBusinesses))
}

export function useSelectedAccountUidSuspenseQuery (keyofBusinesses: KeyofBusinesses) {
  return useSuspenseQuery(selectedAccountUidQueryOptions(keyofBusinesses))
}

export function useSelectedAccountUidSuspenseQueryData (keyofBusinesses: KeyofBusinesses) {
  return useSelectedAccountUidSuspenseQuery(keyofBusinesses)
    .data
}

export function useSelectedAccountSuspenseQueryData (keyofBusinesses: KeyofBusinesses) {
  const accounts = useAccountsSuspenseQueryData(keyofBusinesses)
  const selectedAccountUid = useSelectedAccountUidSuspenseQueryData(keyofBusinesses)
  return accounts.find((el) => el.uid === selectedAccountUid) ?? null
}

export function ensureSelectedAccountUidQueryData (keyofBusinesses: KeyofBusinesses) {
  return queryClient.ensureQueryData(selectedAccountUidQueryOptions(keyofBusinesses))
}

export function invalidateSelectedAccountUidQuery (keyofBusinesses: KeyofBusinesses) {
  return queryClient.invalidateQueries({
    queryKey: selectedAccountUidQueryKey(keyofBusinesses),
  })
}

// Mutation

const UpdateSelectedAccountUidQueryKey = [KeyAccounts, 'Update', 'SelectedAccountUid']

export interface UpdateSelectedAccountUidArgs<T extends Business> {
  business: T
  data: Account<T>['uid'] | null
}

export function useUpdateSelectedAccountUidMutation<T extends Business> () {
  return useMutation<
    Account<T> | null,
    SqlxError | SqlxDatabaseError | Error,
    UpdateSelectedAccountUidArgs<T>
  >({
    mutationKey: UpdateSelectedAccountUidQueryKey,
    async mutationFn (args) {
      const keyofBusinesses = ReversedBusinesses[args.business]

      if (args.data) {
        const existed = getAccountsQueryData(keyofBusinesses)?.find((el) => el.uid === args.data)
        if (!existed) {
          console.warn('The selected account %o does not exist in the %s accounts list', args.data, keyofBusinesses)
          return null
        }

        await SelectedAccountUidStorage.save(keyofBusinesses, existed.uid)
        return existed as Account<T>
      } else {
        await SelectedAccountUidStorage.delete(keyofBusinesses)
        return null
      }
    },
    onSuccess (_, args) {
      // Invalidate the query cache for selected account
      invalidateSelectedAccountUidQuery(ReversedBusinesses[args.business])
    },
  })
}

// #endregion
