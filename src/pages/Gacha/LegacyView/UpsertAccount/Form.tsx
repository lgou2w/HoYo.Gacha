import React, { MouseEventHandler, useCallback } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Input, Textarea, buttonClassNames, makeStyles, tokens } from '@fluentui/react-components'
import { CursorHoverRegular, FolderSearchRegular, PersonTagRegular } from '@fluentui/react-icons'
import { produce } from 'immer'
import { DataFolder, LocateDataFolderFactory, isDataFolderError, locateDataFolder } from '@/api/commands/business'
import { isDetailedError } from '@/api/error'
import { useCreateAccountMutation, useUpdateAccountDataFolderAndPropertiesMutation } from '@/api/queries/account'
import Locale from '@/components/UI/Locale'
import { Account, detectAccountUidRegion } from '@/interfaces/Account'
import { Business, KeyofBusinesses } from '@/interfaces/Business'
import UpsertAccountFormField from './FormField'
import { DisplayNameMaxLength, UpsertAccountFormData } from './declares'

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
      minWidth: '4rem',
      [`& .${buttonClassNames.icon}`]: {
        fontSize: tokens.fontSizeBase500,
        width: tokens.fontSizeBase500,
        height: tokens.fontSizeBase500,
      },
      [`&[data-factory="${LocateDataFolderFactory.UnityLog}"]:not([disabled])`]: {
        color: tokens.colorPaletteBerryForeground1,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteBerryForeground1}`,
      },
      [`&[data-factory="${LocateDataFolderFactory.Manual}"]:not([disabled])`]: {
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
  const classes = useStyles()
  const { edit, business, keyofBusinesses, accounts, onCancel, onSuccess } = props

  const isEditMode = !!edit
  const { t } = useTranslation()
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
    const factory = (evt.currentTarget as HTMLButtonElement).dataset?.factory as LocateDataFolderFactory | null
    if (!factory) return

    const region = detectAccountUidRegion(business, getValues('uid'))
    if (!region) {
      trigger('uid', { shouldFocus: true })
      return
    }

    let dataFolder: DataFolder<Business>
    try {
      dataFolder = await locateDataFolder({
        business,
        region,
        factory,
      })
    } catch (e) {
      setError('dataFolder', {
        message: isDataFolderError(e) || e instanceof Error
          ? e.message
          : String(e),
      })
      return
    }

    setValue('dataFolder', dataFolder.value, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [business, getValues, setError, setValue, trigger])

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
    } catch (e) {
      setError('uid', {
        message: isDetailedError(e) || e instanceof Error
          ? e.message
          : String(e),
      })
      return
    }

    onSuccess?.(result)
  }, [business, createAccountMutation, edit, isEditMode, onSuccess, setError, updateAccountDataFolderAndPropertiesMutation])

  return (
    <form
      className={classes.root}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <UpsertAccountFormField
        name="uid"
        control={control}
        rules={{
          required: {
            value: true,
            message: t('Pages.Gacha.LegacyView.UpsertAccountForm.Uid.Required'),
          },
          validate (value) {
            if (isEditMode) return

            const uid = value && parseInt(value)
            if (!uid || !detectAccountUidRegion(business, uid)) {
              return t('Pages.Gacha.LegacyView.UpsertAccountForm.Uid.Pattern')
            }

            if (accounts.find((v) => v.uid === uid)) {
              return t('Pages.Gacha.LegacyView.UpsertAccountForm.Uid.AlreadyExists')
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
          return field.value && detectAccountUidRegion(business, field.value)
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
            message: t('Pages.Gacha.LegacyView.UpsertAccountForm.DisplayName.Length'),
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
      <div className={classes.dataFolder}>
        <UpsertAccountFormField
          name="dataFolder"
          control={control}
          rules={{
            required: {
              value: true,
              message: t('Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.Required'),
            },
          }}
          component={Textarea}
          labelMapping={['Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.Label']}
          placeholderMapping={[
            'Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.Placeholder',
            { business: keyofBusinesses },
          ]}
          rows={3}
          required
          readOnly
        />
        <div className={classes.dataFolderBtns}>
          <Locale
            component={Button}
            mapping={['Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.AutoFindBtn']}
            size="small"
            icon={<FolderSearchRegular />}
            disabled={isSubmitting}
            onClick={handleLocateDataFolder}
            data-factory={LocateDataFolderFactory.UnityLog}
          />
          <Locale
            component={Button}
            mapping={['Pages.Gacha.LegacyView.UpsertAccountForm.DataFolder.ManualFindBtn']}
            size="small"
            icon={<CursorHoverRegular />}
            disabled={isSubmitting}
            onClick={handleLocateDataFolder}
            data-factory={LocateDataFolderFactory.Manual}
          />
        </div>
      </div>
      <div className={classes.actions}>
        <Locale
          component={Button}
          mapping={['Pages.Gacha.LegacyView.UpsertAccountForm.CancelBtn']}
          appearance="secondary"
          disabled={isSubmitting}
          onClick={onCancel}
        />
        <Locale
          component={Button}
          mapping={['Pages.Gacha.LegacyView.UpsertAccountForm.SubmitBtn']}
          appearance="primary"
          type="submit"
          disabled={
            isEditMode
              ? !isDirty || !isValid || isSubmitting
              : !isValid || isSubmitting
          }
        />
      </div>
    </form>
  )
}
