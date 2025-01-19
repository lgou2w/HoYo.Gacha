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
    async queryFn () {
      const accounts = await findAccountsByBusiness({
        business: Businesses[keyofBusinesses],
      })

      let selected = await SelectedAccountStorage.load(keyofBusinesses)
      if (selected) {
        const existed = accounts.find((el) => el.uid === selected)
        if (!existed) {
          console.warn('The selected account %o does not exist in the %s accounts list', selected, keyofBusinesses)
          await SelectedAccountStorage.delete(keyofBusinesses)
          selected = null
        }
      }

      if (!selected) {
        const firstAccount = accounts[0] ?? null
        if (firstAccount) {
          console.warn('Auto-selecting first account %o for %s', firstAccount, keyofBusinesses)
          await SelectedAccountStorage.save(keyofBusinesses, firstAccount)
        }
      }

      return accounts
    },
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
    async onSuccess (data) {
      const keyofBusinesses = ReversedBusinesses[data.business]

      setAccountsData(
        keyofBusinesses,
        produce((draft = []) => {
          draft.push(data)
        }),
      )

      // If not selected, then set to the currently created
      if (!getSelectedAccountData(keyofBusinesses)) {
        await SelectedAccountStorage.save(keyofBusinesses, data)
        setSelectedAccountData(keyofBusinesses, data)
      }
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

function getSelectedAccountData (keyofBusinesses: KeyofBusinesses) {
  return queryClient.getQueryData<Account | null>(selectedAccountKey(keyofBusinesses)) ?? null
}

const SelectedAccountStorage = Object.freeze({
  stringifyKey (keyofBusinesses: KeyofBusinesses): string {
    return `Query:${keyofBusinesses}:SelectedAccount`
  },
  async load (keyofBusinesses: KeyofBusinesses): Promise<number | null> {
    const kv = await findKv({
      key: this.stringifyKey(keyofBusinesses),
    })
    return kv ? +kv.val : null
  },
  async save (keyofBusinesses: KeyofBusinesses, data: Account) {
    await upsertKv({
      key: this.stringifyKey(keyofBusinesses),
      val: String(data.uid),
    })
  },
  async delete (keyofBusinesses: KeyofBusinesses) {
    await deleteKv({
      key: this.stringifyKey(keyofBusinesses),
    })
  },
})

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
      const data = await SelectedAccountStorage.load(keyofBusinesses)
      return data
        ? getAccountsData(keyofBusinesses)?.find((el) => el.uid === data) ?? null
        : null
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
        const existed = getAccountsData(keyofBusinesses)?.find((el) => isSamePrimaryKeyAccount(el, args.data!))
        if (!existed) {
          console.warn('The selected account %o does not exist in the %s accounts list', args.data, keyofBusinesses)
          return null
        }

        await SelectedAccountStorage.save(keyofBusinesses, existed)
        return existed as Account<T>
      } else {
        await SelectedAccountStorage.delete(keyofBusinesses)
        return null
      }
    },
    onSuccess (data, args) {
      setSelectedAccountData(ReversedBusinesses[args.business], data)
    },
  })
}
