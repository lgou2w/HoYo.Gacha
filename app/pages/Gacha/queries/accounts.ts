import { MutationFunction, MutationKey, queryOptions, useMutation, useQuery, useSuspenseQueries, useSuspenseQuery } from '@tanstack/react-query'
import { produce } from 'immer'
import { DatabaseError } from '@/api/commands/database'
import { Account, AccountBusiness, AccountCommands, CreateAccountArgs, DeleteAccountArgs, KeyofAccountBusiness } from '@/api/schemas/Account'
import { GachaRecordCommands } from '@/api/schemas/GachaRecord'
import { KeyValuePairCommands } from '@/api/schemas/KeyValuePair'
import queryClient from '@/queryClient'
import { invalidatePrettizedRecordsQuery } from './prettizedRecords'

// #region: Accounts

const KeyAccounts = 'Accounts'

function accountsQueryKey (keyof: KeyofAccountBusiness) {
  return [keyof, KeyAccounts] as const
}

type AccountsQueryKey = ReturnType<typeof accountsQueryKey>

function accountsQueryOptions (keyof: KeyofAccountBusiness) {
  return queryOptions<
    Account[],
    Error,
    Account[],
    AccountsQueryKey
  >({
    staleTime: Infinity,
    queryKey: accountsQueryKey(keyof),
    queryFn: async function accountsQueryFn () {
      const business = AccountBusiness[keyof]
      const accounts = await AccountCommands.findAll({ business })
      await SelectedAccountUidStorage.inspect(AccountBusiness[business] as KeyofAccountBusiness, accounts)
      return accounts
    },
  })
}

function getAccountsQueryData (keyof: KeyofAccountBusiness) {
  return queryClient.getQueryData<Account[]>(accountsQueryKey(keyof))
    ?? null
}

type OmitParametersFirst<T extends (...args: never[]) => unknown>
  = T extends (...args: infer P) => unknown
    ? P extends [unknown, ...infer R]
      ? R
      : P
    : never

function setAccountsQueryData (
  keyof: KeyofAccountBusiness,
  ...rest: OmitParametersFirst<typeof queryClient.setQueryData<Account[], AccountsQueryKey>>
) {
  return queryClient.setQueryData<Account[], AccountsQueryKey>(
    accountsQueryKey(keyof),
    ...rest,
  ) ?? null
}

export function useAccountsSuspenseQuery (keyof: KeyofAccountBusiness) {
  return useSuspenseQuery(accountsQueryOptions(keyof))
}

export function ensureAccountsQueryData (keyof: KeyofAccountBusiness) {
  return queryClient.ensureQueryData(accountsQueryOptions(keyof))
}

export function useAccounts (keyof: KeyofAccountBusiness): Account[] {
  return useAccountsSuspenseQuery(keyof)
    .data
}

// Mutation

export function useCreateAccountMutation () {
  return useMutation<
    Account,
    DatabaseError | Error,
    CreateAccountArgs
  >({
    mutationKey: [KeyAccounts, 'Create'],
    mutationFn: AccountCommands.create,
    async onSuccess (data) {
      const keyof = AccountBusiness[data.business] as KeyofAccountBusiness

      setAccountsQueryData(
        keyof,
        produce((draft = []) => {
          draft.push(data)
        }),
      )

      // After the creation is complete, select the account
      // and invalidate the query cache for selected account
      await SelectedAccountUidStorage.save(keyof, data.uid)
      await invalidateSelectedAccountUidQuery(keyof)
    },
  })
}

function updateAccountsQueryDataElementFields<U extends keyof Account> (
  fields: U[],
  update: Account | null,
) {
  update && setAccountsQueryData(
    AccountBusiness[update.business] as KeyofAccountBusiness,
    produce((draft = []) => {
      let index: number
      if ((index = draft.findIndex(
        (el) => el.business === update.business
          && el.uid === update.uid)
      ) !== -1) {
        for (const field of fields) {
          draft[index][field] = update[field]
        }
      }
    }),
  )
}

function createUpdateAccountFieldsMutation<Args, U extends keyof Account> (
  mutationKey: MutationKey,
  mutationFn: MutationFunction<Account | null, Args>,
  fields: U[],
) {
  return () => {
    return useMutation<
      Account | null,
      DatabaseError | Error,
      Args
    >({
      mutationKey,
      mutationFn,
      onSuccess (data) {
        updateAccountsQueryDataElementFields(fields, data)
      },
    })
  }
}

export const useUpdateAccountDataFolderMutation = createUpdateAccountFieldsMutation(
  [KeyAccounts, 'Update', 'DataFolder'],
  AccountCommands.updateDataFolder,
  ['dataFolder'],
)

export const useUpdateAccountPropertiesMutation = createUpdateAccountFieldsMutation(
  [KeyAccounts, 'Update', 'Properties'],
  AccountCommands.updateProperties,
  ['properties'],
)

export const useUpdateAccountDataFolderAndPropertiesMutation = createUpdateAccountFieldsMutation(
  [KeyAccounts, 'Update', 'DataFolderAndProperties'],
  AccountCommands.updateDataFolderAndProperties,
  ['dataFolder', 'properties'],
)

export function useDeleteAccountMutation () {
  return useMutation<
    Account | null,
    DatabaseError | Error,
    DeleteAccountArgs
  >({
    mutationKey: [KeyAccounts, 'Delete'],
    mutationFn: AccountCommands.delete,
    async onSuccess (data) {
      if (!data) return

      const keyof = AccountBusiness[data.business] as KeyofAccountBusiness
      const accounts = setAccountsQueryData(
        keyof,
        produce((draft = []) => {
          let index: number
          if ((index = draft.findIndex(
            (el) => el.business === data.business
              && el.uid === data.uid)
          ) !== -1) {
            draft.splice(index, 1)
          }
        }),
      )

      // If the deleted account was selected, delete the selected account uid
      if (accounts) {
        await SelectedAccountUidStorage.inspect(keyof, accounts)
        await invalidateSelectedAccountUidQuery(keyof)
      }
    },
  })
}

export function useDeleteAccountWholeMutation () {
  const dep = useDeleteAccountMutation()
  return useMutation<
    | { account: Account, deletedRecords?: number }
    | null,
    DatabaseError | Error,
    DeleteAccountArgs & (
      | { whole?: null }
      | { whole: boolean, customLocale: string }
    )
  >({
    mutationKey: [KeyAccounts, 'DeleteWhole'],
    mutationFn: async function deleteAccountWholeMutationFn (args) {
      const { whole, ...rest } = args
      const account = await dep.mutateAsync(rest)

      // If the account is successfully deleted, then the result will not be `null`.
      // Furthermore, if `whole` is true, then all data records will be completely deleted.
      if (account && whole === true) {
        const records = await GachaRecordCommands.delete({
          business: args.business,
          uid: args.uid,
        })

        console.debug(`Deleted ${records} data records for account:`, account)
        return { account, deletedRecords: records }
      } else if (account) {
        // Deleted the account only
        return { account }
      } else {
        // No deleted accounts were matched.
        return null
      }
    },
    onSuccess (data, args) {
      // If the account deletion is successful,
      // and the number of deleted data records is greater than 0,
      // and `whole` is `true`.
      if (data
        && data.deletedRecords
        && data.deletedRecords > 0
        && args.whole === true
      ) {
        // Delete the prettized query cache
        invalidatePrettizedRecordsQuery(
          data.account.business,
          data.account.uid,
          args.customLocale,
        )
      }
    },
  })
}

// #endregion

// #region: Selected Account Uid

const SelectedAccountUidStorage = Object.freeze({
  databaseKey (keyof: KeyofAccountBusiness) {
    return `Query:${keyof}:SelectedAccountUid` as const
  },
  async load (keyof: KeyofAccountBusiness): Promise<Account['uid'] | null> {
    const kv = await KeyValuePairCommands.find({
      key: this.databaseKey(keyof),
    })
    return kv ? +kv.val : null
  },
  async save (keyof: KeyofAccountBusiness, uid: Account['uid']) {
    await KeyValuePairCommands.upsert({
      key: this.databaseKey(keyof),
      val: String(uid),
    })
  },
  async delete (keyof: KeyofAccountBusiness) {
    await KeyValuePairCommands.delete({
      key: this.databaseKey(keyof),
    })
  },
  async inspect (keyof: KeyofAccountBusiness, accounts: Account[]) {
    let selected = await this.load(keyof)
    if (selected) {
      const existed = accounts.find((el) => el.uid === selected)
      if (!existed) {
        console.warn('The selected account %o does not exist in the %s accounts list', selected, keyof)
        await this.delete(keyof)
        selected = null
      }
    }

    if (!selected) {
      const firstAccount = accounts[0] ?? null
      if (firstAccount) {
        console.warn('Auto-selecting first account %o for %s', firstAccount, keyof)
        await this.save(keyof, firstAccount.uid)
      }
    }
  },
})

const KeySelectedAccountUid = 'SelectedAccountUid'

function selectedAccountUidQueryKey (keyof: KeyofAccountBusiness) {
  return [keyof, KeyAccounts, KeySelectedAccountUid] as const
}

type SelectedAccountUidQueryKey = ReturnType<typeof selectedAccountUidQueryKey>

function selectedAccountUidQueryOptions (keyof: KeyofAccountBusiness) {
  return queryOptions<
    Account['uid'] | null,
    Error,
    Account['uid'] | null,
    SelectedAccountUidQueryKey
  >({
    gcTime: Infinity, // Don't gc this data, cache it permanently
    staleTime: Infinity,
    queryKey: selectedAccountUidQueryKey(keyof),
    queryFn: async function selectedAccountUidQueryFn () {
      return SelectedAccountUidStorage.load(keyof)
    },
  })
}

export function useSelectedAccountUidQuery (keyof: KeyofAccountBusiness) {
  return useQuery(selectedAccountUidQueryOptions(keyof))
}

export function useSelectedAccountUidSuspenseQuery (keyof: KeyofAccountBusiness) {
  return useSuspenseQuery(selectedAccountUidQueryOptions(keyof))
}

export function ensureSelectedAccountUidQueryData (
  keyof: KeyofAccountBusiness,
) {
  return queryClient.ensureQueryData(selectedAccountUidQueryOptions(keyof))
}

export function invalidateSelectedAccountUidQuery (
  keyof: KeyofAccountBusiness,
) {
  return queryClient.invalidateQueries({
    queryKey: selectedAccountUidQueryKey(keyof),
  })
}

export function useSelectedAccount (keyof: KeyofAccountBusiness): Account | null {
  const [{ data: accounts }, { data: selectedAccountUid }] = useSuspenseQueries({
    queries: [
      accountsQueryOptions(keyof),
      selectedAccountUidQueryOptions(keyof),
    ],
  })

  return accounts.find((el) => el.uid === selectedAccountUid)
    ?? null
}

const UpdateSelectedAccountUidQueryKey = [KeyAccounts, 'Update', 'SelectedAccountUid']

export interface UpdateSelectedAccountUidArgs {
  business: AccountBusiness
  data: Account['uid'] | null
}

export function useSelectedAccountUidMutation () {
  return useMutation<
    Account | null,
    Error,
    UpdateSelectedAccountUidArgs
  >({
    mutationKey: UpdateSelectedAccountUidQueryKey,
    async mutationFn (args) {
      const keyof = AccountBusiness[args.business] as KeyofAccountBusiness

      if (args.data) {
        const accounts = getAccountsQueryData(keyof)
        const existed = accounts?.find((el) => el.uid === args.data)
        if (!existed) {
          console.warn('The selected account %o does not exist in the %s accounts list', args.data, keyof)
          return null
        }

        await SelectedAccountUidStorage.save(keyof, existed.uid)
        return existed as Account
      } else {
        await SelectedAccountUidStorage.delete(keyof)
        return null
      }
    },
    onSuccess (_data, args) {
      // Invalidate the query cache for selected account
      invalidateSelectedAccountUidQuery(
        AccountBusiness[args.business] as KeyofAccountBusiness,
      )
    },
  })
}

// #endregion
