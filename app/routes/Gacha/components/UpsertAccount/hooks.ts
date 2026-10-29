import { useCallback, useMemo } from 'react'
import { RegisterOptions, SubmitHandler, useForm } from 'react-hook-form'
import { produce } from 'immer'
import { Account, AccountBusiness, KnownAccountProperties } from '@/api/Account'
import errorTrans from '@/api/errorTrans'
import { UseI18n } from '@/i18n'
import { BusinessCommands, DataFolder, DataFolderLocatorFactoryKind } from '@/routes/Gacha/api/business'
import { useCreateAccountMutation, useUpdateAccountDataFolderAndPropertiesMutation } from '@/routes/Gacha/contexts/Account/hooks'

export const DisplayNameMaxLength = 16

function isSafeU32 (n: number): boolean {
  return Number.isSafeInteger(n) && n >= 0 && n <= 0xFFFF_FFFF
}

function mergeDisplayName (
  current: Account['properties'],
  displayName: KnownAccountProperties['displayName'],
): Account['properties'] {
  if (!displayName) {
    return current
  } else if (!current) {
    return { displayName }
  } else {
    return produce(current, (draft) => {
      draft.displayName = displayName
    })
  }
}

export interface UpsertAccountFormValues {
  uid: string
  displayName: string | undefined
  dataFolder: string
}

export interface UseUpsertAccountFormOptions {
  t: UseI18n['t']
  i18nScope: string
  business: AccountBusiness
  accounts: Account[]
  owner: Account | null
  onSuccess?: (data: Account) => void
}

export function useUpsertAccountForm (options: UseUpsertAccountFormOptions) {
  const { t, i18nScope, business, accounts, owner, onSuccess } = options
  const {
    control, formState, handleSubmit, getFieldState, getValues, trigger, setError, setValue,
  } = useForm<UpsertAccountFormValues>({
    mode: 'onChange',
    defaultValues: { uid: '', displayName: '', dataFolder: '' },
    values: {
      uid: owner?.uid.toString() || '',
      displayName: owner?.properties?.displayName || '',
      dataFolder: owner?.dataFolder || '',
    },
  })

  const isEditMode = !!owner
  const disabled
    = formState.isSubmitting
      || !formState.isValid
      || (isEditMode && !formState.isDirty)

  const uidRules = useMemo<RegisterOptions<UpsertAccountFormValues, 'uid'>>(() => ({
    required: t(`${i18nScope}.Uid.Required`),
    async validate (value) {
      if (isEditMode) {
        return
      }

      const uid = value ? Number(value) : NaN
      if (!isSafeU32(uid)) {
        return t(`${i18nScope}.Uid.Pattern`)
      }

      if (accounts.some((account) => account.uid === uid)) {
        return t(`${i18nScope}.Uid.Exists`)
      }

      const validated = await BusinessCommands.validateUid({ business, uid })
      if (!validated) {
        return t(`${i18nScope}.Uid.Pattern`)
      }
    },
  }), [accounts, business, i18nScope, isEditMode, t])

  const displayNameRules = useMemo<RegisterOptions<UpsertAccountFormValues, 'displayName'>>(() => ({
    maxLength: {
      value: DisplayNameMaxLength,
      message: t(`${i18nScope}.DisplayName.MaxLength`),
    },
  }), [i18nScope, t])

  const dataFolderRules = useMemo<RegisterOptions<UpsertAccountFormValues, 'dataFolder'>>(() => ({
    required: t(`${i18nScope}.DataFolder.Required`),
    deps: ['uid'],
  }), [i18nScope, t])

  const localeDataFolder = useCallback(async (kind: DataFolderLocatorFactoryKind) => {
    const uid = getValues('uid')
    if (!uid || getFieldState('uid').invalid) {
      trigger('uid', { shouldFocus: true })
      return
    }

    const promise = BusinessCommands.locateDataFolder({
      business,
      uid: +uid,
      factory: kind === DataFolderLocatorFactoryKind.Manual
        ? { [DataFolderLocatorFactoryKind.Manual]: { title: 'File dialog' } }
        : { [DataFolderLocatorFactoryKind.UnityLog]: null },
    })

    let result: DataFolder | null
    try {
      result = await promise
    } catch (error) {
      const message = errorTrans(t, error)
      setError('dataFolder', { message }, { shouldFocus: true })
      return
    }

    if (result) {
      setValue('dataFolder', result.value, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [business, getFieldState, getValues, setError, setValue, t, trigger])

  const handleAutoFind = useCallback(() => {
    void localeDataFolder(DataFolderLocatorFactoryKind.UnityLog)
  }, [localeDataFolder])

  const handleManualFind = useCallback(() => {
    void localeDataFolder(DataFolderLocatorFactoryKind.Manual)
  }, [localeDataFolder])

  const { mutateAsync: createAccount } = useCreateAccountMutation()
  const { mutateAsync: updateAccount } = useUpdateAccountDataFolderAndPropertiesMutation()

  const handleUpsert = useCallback<SubmitHandler<UpsertAccountFormValues>>(async (data) => {
    const { uid, displayName, dataFolder } = data

    const promise = !owner
      ? createAccount({
          business,
          uid: +uid,
          dataFolder,
          properties: displayName
            ? { displayName }
            : null,
        })
      : updateAccount({
          business,
          uid: +uid,
          dataFolder,
          properties: mergeDisplayName(owner.properties, displayName),
        })
          .then((exists) => exists || owner)

    let result: Account
    try {
      result = await promise
    } catch (error) {
      const message = errorTrans(t, error)
      setError('uid', { message }, { shouldFocus: true })
      return
    }

    onSuccess?.(result)
  }, [business, createAccount, onSuccess, owner, setError, t, updateAccount])

  return {
    control,
    formState,
    isEditMode,
    disabled,
    onSubmit: handleSubmit(handleUpsert),
    uidRules,
    displayNameRules,
    dataFolderRules,
    handleAutoFind,
    handleManualFind,
  }
}
