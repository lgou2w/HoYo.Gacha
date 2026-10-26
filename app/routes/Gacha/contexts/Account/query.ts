import { MutationFunction, MutationKey, Updater, mutationOptions, queryOptions } from '@tanstack/react-query'
import { produce } from 'immer'
import { Account, AccountBusiness, AccountCommands, CreateAccountArgs, DeleteAccountArgs, KeyofAccountBusiness } from '@/api/Account'
import { GachaRecordCommands } from '@/api/GachaRecord'
import { KValueStore, createKValueStore } from '@/api/KValue'
import { DatabaseError } from '@/api/error'
import queryClient from '@/queryClient'
import { CustomLocale } from '@/routes/Gacha/api/business'
import { invalidateGachaStatsQuery } from '@/routes/Gacha/contexts/Stats/query'

// #region: Accounts

const KeyAccounts = 'Accounts'

function accountsQueryKey (keyof: KeyofAccountBusiness) {
  return [keyof, KeyAccounts] as const
}

type AccountsQueryKey = ReturnType<typeof accountsQueryKey>

export function accountsQueryOptions (keyof: KeyofAccountBusiness) {
  return queryOptions<
    Account[],
    DatabaseError | Error,
    Account[],
    AccountsQueryKey
  >({
    staleTime: Infinity,
    queryKey: accountsQueryKey(keyof),
    queryFn: async function accountsQueryFn () {
      const accounts = await AccountCommands.findAll({ business: AccountBusiness[keyof] })
      const selected = await SelectedAccountUidStorage.inspect(keyof, accounts)
      queryClient.setQueryData<Account['uid'] | null>(
        selectedAccountUidQueryKey(keyof),
        selected,
      )
      return accounts
    },
  })
}

function getAccountsQueryData (keyof: KeyofAccountBusiness) {
  return queryClient.getQueryData<Account[]>(accountsQueryKey(keyof))
    ?? null
}

function setAccountsQueryData (
  keyof: KeyofAccountBusiness,
  updater: Updater<Account[] | undefined, Account[] | undefined>,
) {
  return queryClient.setQueryData<Account[], AccountsQueryKey>(
    accountsQueryKey(keyof),
    updater,
  ) ?? null
}

export function ensureAccountsQueryData (keyof: KeyofAccountBusiness) {
  return queryClient.query({
    ...accountsQueryOptions(keyof),
    staleTime: 'static',
  })
}

// Mutation

export function createAccountMutationOptions () {
  return mutationOptions<
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

      // After creation, select the new account.
      await SelectedAccountUidStorage.save(keyof, data.uid)
      queryClient.setQueryData<Account['uid'] | null>(
        selectedAccountUidQueryKey(keyof),
        data.uid,
      )
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

function createUpdateAccountFieldsMutationOptions<Args, U extends keyof Account> (
  mutationKey: MutationKey,
  mutationFn: MutationFunction<Account | null, Args>,
  fields: U[],
) {
  return () => {
    return mutationOptions<
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

export const updateAccountDataFolderMutationOptions = createUpdateAccountFieldsMutationOptions(
  [KeyAccounts, 'Update', 'DataFolder'],
  AccountCommands.updateDataFolder,
  ['dataFolder'],
)

export const updateAccountPropertiesMutation = createUpdateAccountFieldsMutationOptions(
  [KeyAccounts, 'Update', 'Properties'],
  AccountCommands.updateProperties,
  ['properties'],
)

export const updateAccountDataFolderAndPropertiesMutation = createUpdateAccountFieldsMutationOptions(
  [KeyAccounts, 'Update', 'DataFolderAndProperties'],
  AccountCommands.updateDataFolderAndProperties,
  ['dataFolder', 'properties'],
)

async function onDeleteAccountSuccess (data: Account) {
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

  // If the deleted account was selected, re-inspect the selection.
  if (accounts) {
    const selected = await SelectedAccountUidStorage.inspect(keyof, accounts)
    queryClient.setQueryData<Account['uid'] | null>(
      selectedAccountUidQueryKey(keyof),
      selected,
    )
  }
}

export function deleteAccountMutationOptions () {
  return mutationOptions<
    Account | null,
    DatabaseError | Error,
    DeleteAccountArgs
  >({
    mutationKey: [KeyAccounts, 'Delete'],
    mutationFn: AccountCommands.delete,
    async onSuccess (data) {
      data && await onDeleteAccountSuccess(data)
    },
  })
}

export function deleteAccountWholeMutationOptions () {
  return mutationOptions<
    | { account: Account, deletedRecords?: number }
    | null,
    DatabaseError | Error,
    DeleteAccountArgs & (
      | { whole?: null }
      | { whole: boolean, customLocale: CustomLocale }
    )
  >({
    mutationKey: [KeyAccounts, 'DeleteWhole'],
    async mutationFn (args) {
      const { business, uid, whole } = args
      const account = await AccountCommands.delete({ business, uid })

      // `null` means no account matched — nothing else to do.
      if (!account) return null

      // Delete the account only.
      if (whole !== true) {
        return { account }
      }

      // Delete the account and all of its records.
      const records = await GachaRecordCommands.delete({ business, uid })
      console.debug(`Deleted ${records} data records for account:`, account)

      return { account, deletedRecords: records }
    },
    async onSuccess (data, args) {
      if (data && data.account) {
        await onDeleteAccountSuccess(data.account)
      }

      // If the account deletion is successful,
      // and the number of deleted data records is greater than 0,
      // and `whole` is `true`.
      if (
        data
        && data.deletedRecords
        && data.deletedRecords > 0
        && args.whole === true
      ) {
        invalidateGachaStatsQuery({
          business: data.account.business,
          uid: data.account.uid,
          customLocale: args.customLocale,
        })
      }
    },
  })
}

// #endregion

// #region: Selected Account Uid

/** `keyof` → `KValueStore`, created once and reused. */
const SelectedAccountUidStores = new Map<KeyofAccountBusiness, KValueStore>()

function selectedAccountUidStore (keyof: KeyofAccountBusiness): KValueStore {
  let store = SelectedAccountUidStores.get(keyof)
  if (!store) {
    store = createKValueStore({
      database: `Query:${keyof}:SelectedAccountUid`,
      localStorage: `HG_${keyof.toUpperCase()}_SELECTED_ACCOUNT_UID`,
    })

    SelectedAccountUidStores.set(keyof, store)
  }

  return store
}

const SelectedAccountUidStorage = Object.freeze({
  async load (keyof: KeyofAccountBusiness): Promise<Account['uid'] | null> {
    const val = await selectedAccountUidStore(keyof).read()
    return val ? +val : null
  },
  async save (keyof: KeyofAccountBusiness, uid: Account['uid']) {
    await selectedAccountUidStore(keyof).write(String(uid))
  },
  async delete (keyof: KeyofAccountBusiness) {
    await selectedAccountUidStore(keyof).clear()
  },
  async inspect (keyof: KeyofAccountBusiness, accounts: Account[]) {
    let selected = await this.load(keyof)

    if (selected) {
      const existed = accounts.find((el) => el.uid === selected)
      if (!existed) {
        console.debug(
          'The selected account %o does not exist in the %s accounts list',
          selected,
          keyof,
        )
        await this.delete(keyof)
        selected = null
      }
    }

    if (!selected) {
      const firstAccount = accounts[0] ?? null
      if (firstAccount) {
        console.debug('Auto-selecting first account %o for %s', firstAccount, keyof)
        await this.save(keyof, firstAccount.uid)
        selected = firstAccount.uid
      }
    }

    return selected
  },
})

const SelectedAccountUidKey = 'SelectedAccountUid'

function selectedAccountUidQueryKey (keyof: KeyofAccountBusiness) {
  return [keyof, KeyAccounts, SelectedAccountUidKey] as const
}

type SelectedAccountUidQueryKey = ReturnType<typeof selectedAccountUidQueryKey>

export function selectedAccountUidQueryOptions (keyof: KeyofAccountBusiness) {
  return queryOptions<
    Account['uid'] | null,
    DatabaseError | Error,
    Account['uid'] | null,
    SelectedAccountUidQueryKey
  >({
    staleTime: Infinity,
    queryKey: selectedAccountUidQueryKey(keyof),
    queryFn: async function selectedAccountUidQueryFn () {
      return SelectedAccountUidStorage.load(keyof)
    },
  })
}

export function ensureSelectedAccountUidQueryData (
  keyof: KeyofAccountBusiness,
) {
  return queryClient.query({
    ...selectedAccountUidQueryOptions(keyof),
    staleTime: 'static',
  })
}

// Deprecated
// export function invalidateSelectedAccountUidQuery (
//   keyof: KeyofAccountBusiness,
// ) {
//   return queryClient.invalidateQueries({
//     queryKey: selectedAccountUidQueryKey(keyof),
//   })
// }

const UpdateSelectedAccountUidQueryKey = [
  KeyAccounts,
  'Update',
  'SelectedAccountUid',
] as const

export interface UpdateSelectedAccountUidArgs {
  business: AccountBusiness
  data: Account['uid'] | null
}

export function selectedAccountUidMutationOptions () {
  return mutationOptions<
    Account | null,
    DatabaseError | Error,
    UpdateSelectedAccountUidArgs
  >({
    mutationKey: UpdateSelectedAccountUidQueryKey,
    async mutationFn (args) {
      const keyof = AccountBusiness[args.business] as KeyofAccountBusiness

      if (args.data) {
        const accounts = getAccountsQueryData(keyof)
        const existed = accounts?.find((el) => el.uid === args.data)

        if (!existed) {
          console.debug(
            'The selected account %o does not exist in the %s accounts list',
            args.data,
            keyof,
          )
          return null
        }

        await SelectedAccountUidStorage.save(keyof, existed.uid)
        return existed
      } else {
        await SelectedAccountUidStorage.delete(keyof)
        return null
      }
    },
    onSuccess (data, args) {
      const keyof = AccountBusiness[args.business] as KeyofAccountBusiness
      queryClient.setQueryData<Account['uid'] | null>(
        selectedAccountUidQueryKey(keyof),
        data?.uid ?? null,
      )
    },
  })
}

// #endregion
