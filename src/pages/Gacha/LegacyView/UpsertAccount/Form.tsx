import React, { MouseEventHandler, useCallback } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Button, Input, Textarea, buttonClassNames, makeStyles, tokens } from '@fluentui/react-components'
import { CursorHoverRegular, FolderSearchRegular, PersonTagRegular } from '@fluentui/react-icons'
import { produce } from 'immer'
import { DataFolder, LocateDataFolderFactory, locateDataFolder } from '@/api/commands/business'
import errorTranslation from '@/api/errorTranslation'
import { useCreateAccountMutation, useUpdateAccountDataFolderAndPropertiesMutation } from '@/api/queries/accounts'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { Account } from '@/interfaces/Account'
import { Business, KeyofBusinesses, detectUidBusinessRegion } from '@/interfaces/Business'
import UpsertAccountFormField from './FormField'
import { DisplayNameMaxLength, UpsertAccountFormData } from './declares'

const LocateDataFolderFactoryTypes = {
  UnityLog: 'UnityLog',
  Manual: 'Manual',
  Registry: 'Registry',
} as const

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  dataFolder: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalS,
  },
  dataFolderBtns: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    [`& .${buttonClassNames.root}`]: {
      [`&[data-factory="${LocateDataFolderFactoryTypes.UnityLog}"]:not([disabled])`]: {
        color: tokens.colorPaletteBerryForeground1,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteBerryForeground1}`,
      },
      [`&[data-factory="${LocateDataFolderFactoryTypes.Manual}"]:not([disabled])`]: {
        color: tokens.colorPaletteGreenForeground1,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteGreenForeground1}`,
      },
    },
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
  },
})

interface Props {
  edit?: Account | null
  business: Business
  keyofBusinesses: KeyofBusinesses,
  accounts: Account[]
  onCancel?: () => void
  onSuccess?: (account: Account) => void
}

export default function GachaLegacyViewUpsertAccountForm (props: Props) {
  const styles = useStyles()
  const { edit, business, keyofBusinesses, accounts, onCancel, onSuccess } = props

  const isEditMode = !!edit
  const i18n = useI18n()
  const {
    handleSubmit,
    control,
    getValues,
    setValue,
    setError,
    trigger,
    formState: { isDirty, isValid, isSubmitting },
  } = useForm<UpsertAccountFormData>({
    mode: 'onChange',
    defaultValues: {
      uid: '',
      displayName: '',
      dataFolder: '',
    },
    values: {
      uid: edit?.uid?.toString() || '',
      displayName: edit?.properties?.displayName || '',
      dataFolder: edit?.dataFolder || '',
    },
  })

  const handleLocateDataFolder = useCallback<MouseEventHandler>(async (evt) => {
    const factoryType = evt.currentTarget.getAttribute('data-factory') as keyof typeof LocateDataFolderFactoryTypes | null
    if (!factoryType) {
      console.error('Invalid locate data folder factory type for element:', evt.currentTarget)
      return
    }

    const region = detectUidBusinessRegion(business, getValues('uid'))
    if (!region) {
      trigger('uid', { shouldFocus: true })
      return
    }

    let factory: LocateDataFolderFactory
    if (factoryType === LocateDataFolderFactoryTypes.Manual) {
      // Need to set the title of the file dialog
      factory = {
        [factoryType]: {
          title: i18n.t(
            'Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.ManualFindTitle',
            { keyofBusinesses },
          ),
        },
      }
    } else {
      factory = { [factoryType]: null } as LocateDataFolderFactory
    }

    let dataFolder: DataFolder<Business>
    try {
      dataFolder = await locateDataFolder({
        business,
        region,
        factory,
      })
    } catch (error) {
      const message = errorTranslation(i18n, error)
      setError('dataFolder', { message }, { shouldFocus: true })
      return
    }

    setValue('dataFolder', dataFolder.value, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [business, getValues, i18n, keyofBusinesses, setError, setValue, trigger])

  const createAccountMutation = useCreateAccountMutation()
  const updateAccountDataFolderAndPropertiesMutation = useUpdateAccountDataFolderAndPropertiesMutation()

  const onSubmit = useCallback<SubmitHandler<UpsertAccountFormData>>(async (data) => {
    const { uid, dataFolder, displayName } = data
    const args = !isEditMode
      ? {
          business,
          uid: +uid,
          dataFolder,
          properties: displayName ? { displayName } : null,
        }
      : {
          business,
          uid: +uid,
          dataFolder,
          properties: !displayName
            ? edit.properties
            : !edit.properties
                ? { displayName }
                : produce(edit.properties, (draft) => {
                  draft.displayName = displayName
                }),
        }

    let result: Account
    try {
      result = !isEditMode
        ? await createAccountMutation.mutateAsync(args)
        : await updateAccountDataFolderAndPropertiesMutation.mutateAsync(args) || edit
    } catch (error) {
      const message = errorTranslation(i18n, error)
      setError('uid', { message }, { shouldFocus: true })
      return
    }

    onSuccess?.(result)
  }, [business, createAccountMutation, edit, i18n, isEditMode, onSuccess, setError, updateAccountDataFolderAndPropertiesMutation])

  return (
    <form
      className={styles.root}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <UpsertAccountFormField
        name="uid"
        control={control}
        rules={{
          required: i18n.t('Pages.Gacha.LegacyView.UpsertAccountForm.Uid.Required'),
          validate (value) {
            if (isEditMode) return

            const uid = value && parseInt(value)
            if (!uid || !detectUidBusinessRegion(business, uid)) {
              return i18n.t('Pages.Gacha.LegacyView.UpsertAccountForm.Uid.Pattern')
            }

            if (accounts.find((v) => v.uid === uid)) {
              return i18n.t('Pages.Gacha.LegacyView.UpsertAccountForm.Uid.AlreadyExists')
            }
          },
        }}
        component={Input}
        labelMapping={['Pages.Gacha.LegacyView.UpsertAccountForm.Uid.Label']}
        placeholderMapping={['Pages.Gacha.LegacyView.UpsertAccountForm.Uid.Placeholder']}
        before={(
          <svg fill="currentColor" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 7V9H9V15H10V17H6V15H7V9H6V7H10M16 7C17.11 7 18 7.9 18 9V15C18 16.11 17.11 17 16 17H12V7M16 9H14V15H16V9Z" />
          </svg>
        )}
        after={({ field }) => {
          return field.value && detectUidBusinessRegion(business, field.value)
        }}
        disabled={isEditMode}
        required
      />
      <UpsertAccountFormField
        name="displayName"
        control={control}
        rules={{
          maxLength: {
            value: DisplayNameMaxLength,
            message: i18n.t('Pages.Gacha.LegacyView.UpsertAccountForm.DisplayName.Length'),
          },
        }}
        component={Input}
        labelMapping={['Pages.Gacha.LegacyView.UpsertAccountForm.DisplayName.Label']}
        placeholderMapping={['Pages.Gacha.LegacyView.UpsertAccountForm.DisplayName.Placeholder']}
        before={<PersonTagRegular />}
        after={({ field }) => {
          const length = field.value?.length
          return length ? `${length} / ${DisplayNameMaxLength}` : undefined
        }}
      />
      <div className={styles.dataFolder}>
        <UpsertAccountFormField
          name="dataFolder"
          control={control}
          rules={{
            required: i18n.t('Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.Required'),
          }}
          component={Textarea}
          labelMapping={['Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.Label']}
          placeholderMapping={[
            'Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.Placeholder',
            { keyofBusinesses },
          ]}
          rows={3}
          required
          readOnly
        />
        <div className={styles.dataFolderBtns}>
          <Locale
            component={Button}
            size="small"
            icon={<FolderSearchRegular />}
            disabled={isSubmitting}
            onClick={handleLocateDataFolder}
            data-factory={LocateDataFolderFactoryTypes.UnityLog}
            mapping={['Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.AutoFindBtn']}
          />
          <Locale
            component={Button}
            size="small"
            icon={<CursorHoverRegular />}
            disabled={isSubmitting}
            onClick={handleLocateDataFolder}
            data-factory={LocateDataFolderFactoryTypes.Manual}
            mapping={['Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.ManualFindBtn']}
          />
        </div>
      </div>
      <div className={styles.actions}>
        <Locale
          component={Button}
          appearance="secondary"
          disabled={isSubmitting}
          onClick={onCancel}
          mapping={['Pages.Gacha.LegacyView.UpsertAccountForm.CancelBtn']}
        />
        <Locale
          component={Button}
          appearance="primary"
          type="submit"
          disabled={
            isEditMode
              ? !isDirty || !isValid || isSubmitting
              : !isValid || isSubmitting
          }
          mapping={['Pages.Gacha.LegacyView.UpsertAccountForm.SubmitBtn']}
        />
      </div>
    </form>
  )
}
