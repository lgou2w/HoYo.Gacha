import React, { useCallback } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Input, Textarea, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { CursorHoverRegular, FolderSearchRegular, PersonTagRegular } from '@fluentui/react-icons'
import { dialog } from '@tauri-apps/api'
import { produce } from 'immer'
import { Account, UidRegex, isCorrectUid, isOverseaServer } from '@/api/interfaces/account'
import { DataDirectory } from '@/api/interfaces/gacha-facet'
import { GachaFacetPlugin, isDatabaseError, isGachaFacetError, stringifyGachaFacetErrorKind } from '@/api/plugins'
import { useAccountsQuery, useCreateAccountMutation, useUpdateAccountGameDataDirAndPropertiesMutation } from '@/api/queries/account'
import useAccountsFacetView from '@/components/Accounts/FacetView/useAccountsFacetView'
import Locale from '@/components/Core/Locale'
import useToaster from '@/components/Core/Toaster/useToaster'
import { IdentifierRegular } from '@/components/Utilities/Icons'
import AddOrEditFormField from './Field'
import { FormData, DisplayNameMaxLength } from './declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS
  },
  gameDataDir: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalS
  },
  gameDataDirBtns: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    '> .fui-Button': {
      minHeight: '1.5rem',
      minWidth: '4rem',
      '> .fui-Button__icon': {
        fontSize: '1.25rem',
        width: '1.25rem',
        height: '1.25rem'
      }
    },
    '> .btn-auto-find:not([disabled])': {
      color: tokens.colorPaletteBerryForeground1,
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteBerryForeground1)
    },
    '> .btn-manual-find:not([disabled])': {
      color: tokens.colorPaletteGreenForeground1,
      ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorPaletteGreenForeground1)
    }
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end'
  }
})

// TODO: Generic Form Wrapped

interface Props {
  // Add mode if null, Edit mode otherwise
  edit: Account | null
  onCancel?: () => void
  onSuccess?: (account: Account) => void
}

export default function AddOrEditForm (props: Props) {
  const { edit, onCancel, onSuccess } = props
  const { keyOfFacets, facet } = useAccountsFacetView()
  const { data: accounts } = useAccountsQuery()
  const { notifyLocale } = useToaster()
  const { t } = useTranslation()

  const isEditMode = !!edit
  const {
    handleSubmit,
    control,
    getValues,
    setValue,
    setError,
    formState: { isDirty, isValid, isSubmitting }
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      uid: '',
      displayName: '',
      gameDataDir: ''
    },
    values: {
      uid: edit?.uid.toString() || '',
      displayName: edit?.properties?.displayName || '',
      gameDataDir: edit?.gameDataDir || ''
    }
  })

  const handleAutoFindGameDataDir = useCallback(async () => {
    const uid = getValues('uid')
    const isOversea = isCorrectUid(uid) ? isOverseaServer(uid) : null

    // If the uid field is not filled in or is incorrect, find all data dirs
    let dataDirectories: DataDirectory[] = []
    try {
      if (isOversea === null) {
        dataDirectories = await GachaFacetPlugin.findDataDirs({ facet })
      } else {
        const dataDirectory = await GachaFacetPlugin.findDataDir({ facet, isOversea })
        dataDirectory && (dataDirectories.push(dataDirectory))
      }
    } catch (e) {
      let message: string
      if (isGachaFacetError(e)) {
        message = t('error.gachaFacet.formattingMessage', {
          message: e.message,
          kind: stringifyGachaFacetErrorKind(e.kind)
        })
      } else {
        message = t('error.unexpected.formattingMessage', {
          message: (e as Error).message || String(e)
        })
      }

      setError('gameDataDir', { message }, { shouldFocus: true })
      return
    }

    if (dataDirectories.length === 0) {
      setError('gameDataDir', {
        message: t('components.accounts.facetView.addOrEditForm.gameDataDir.emptyFind')
      }, { shouldFocus: true })
    } else {
      // TODO: If there are multiple data directories
      // because the uid is not provided.
      // Allow the user to select
      setValue('gameDataDir', dataDirectories[0].path, {
        shouldDirty: true,
        shouldValidate: true
      })
    }
  }, [getValues, facet, setError, t, setValue])

  const handleManualFindGameDataDir = useCallback(async () => {
    let directory = await dialog.open({
      directory: true,
      multiple: false,
      title: t('components.accounts.facetView.addOrEditForm.gameDataDir.manualFindTitle')
    })

    if (typeof directory === 'string') {
      // TODO: Verify that the directory is correct
      directory = directory.replace(/\\/g, '/')
      setValue('gameDataDir', directory, {
        shouldDirty: true,
        shouldValidate: true
      })
    }
  }, [t, setValue])

  const createAccountMutation = useCreateAccountMutation()
  const updateAccountGameDataDirAndPropertiesMutation = useUpdateAccountGameDataDirAndPropertiesMutation()
  const onSubmit = useCallback<SubmitHandler<FormData>>(async (data) => {
    let account: Account
    try {
      account = !edit
        ? await createAccountMutation.mutateAsync({
          facet,
          uid: parseInt(data.uid),
          gameDataDir: data.gameDataDir,
          properties: data.displayName
            ? { displayName: data.displayName }
            : undefined
        })
        : (await updateAccountGameDataDirAndPropertiesMutation.mutateAsync({
            id: edit.id,
            gameDataDir: data.gameDataDir,
            properties: !data.displayName
              ? edit.properties
              : !edit.properties
                  ? { displayName: data.displayName! }
                  : produce(edit.properties, (draft) => {
                    draft.displayName = data.displayName!
                  })
          })) || edit
    } catch (e) {
      let message: string
      if (isDatabaseError(e)) {
        message = e.code === '2067'
          ? t('components.accounts.facetView.addOrEditForm.uid.alreadyExists')
          : t('error.database.formattingMessage', { message: e.message, code: e.code })
      } else {
        message = t('error.unexpected.formattingMessage', {
          message: (e as Error).message || String(e)
        })
      }

      setError('uid', { message }, { shouldFocus: true })
      return
    }

    onSuccess?.(account)
    notifyLocale([
      !edit
        ? 'components.accounts.facetView.addOrEditForm.successAdded'
        : 'components.accounts.facetView.addOrEditForm.successEdited',
      { uid: account.uid }
    ], {
      intent: 'success',
      timeout: 5000
    })
  }, [
    edit,
    facet,
    createAccountMutation,
    updateAccountGameDataDirAndPropertiesMutation,
    t,
    setError,
    onSuccess,
    notifyLocale
  ])

  const classes = useStyles()
  return (
    <form
      className={classes.root}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <AddOrEditFormField
        name="uid"
        control={control}
        rules={{
          required: {
            value: true,
            message: t('components.accounts.facetView.addOrEditForm.uid.required')
          },
          pattern: {
            value: UidRegex,
            message: t('components.accounts.facetView.addOrEditForm.uid.pattern')
          },
          validate (value) {
            if (isEditMode) return
            if (value && accounts?.find((v) => v.uid === +value)) {
              return t('components.accounts.facetView.addOrEditForm.uid.alreadyExists')
            }
          }
        }}
        component={Input}
        labelMapping={['components.accounts.facetView.addOrEditForm.uid.label']}
        placeholderMapping={['components.accounts.facetView.addOrEditForm.uid.placeholder']}
        before={<IdentifierRegular />}
        required
        disabled={isEditMode}
      />
      <AddOrEditFormField
        name="displayName"
        control={control}
        rules={{
          maxLength: {
            value: DisplayNameMaxLength,
            message: t('components.accounts.facetView.addOrEditForm.displayName.length')
          }
        }}
        component={Input}
        labelMapping={['components.accounts.facetView.addOrEditForm.displayName.label']}
        placeholderMapping={['components.accounts.facetView.addOrEditForm.displayName.placeholder']}
        before={<PersonTagRegular />}
        after={({ field }) => {
          const length = field.value?.length
          return length ? `${length} / ${DisplayNameMaxLength}` : undefined
        }}
      />
      <div className={classes.gameDataDir}>
        <AddOrEditFormField
          name="gameDataDir"
          control={control}
          rules={{
            required: {
              value: true,
              message: t('components.accounts.facetView.addOrEditForm.gameDataDir.required')
            }
          }}
          component={Textarea}
          labelMapping={['components.accounts.facetView.addOrEditForm.gameDataDir.label']}
          placeholderMapping={[
            'components.accounts.facetView.addOrEditForm.gameDataDir.placeholder',
            { facet: keyOfFacets }
          ]}
          required
          readOnly
          rows={3}
        />
        <div className={classes.gameDataDirBtns}>
          <Locale
            className="btn-auto-find"
            appearance="secondary"
            component={Button}
            mapping={['components.accounts.facetView.addOrEditForm.gameDataDir.autoFindBtn']}
            size="small"
            icon={<FolderSearchRegular />}
            disabled={isSubmitting}
            onClick={handleAutoFindGameDataDir}
          />
          <Locale
            className="btn-manual-find"
            appearance="secondary"
            component={Button}
            mapping={['components.accounts.facetView.addOrEditForm.gameDataDir.manualFindBtn']}
            size="small"
            icon={<CursorHoverRegular />}
            disabled={isSubmitting}
            onClick={handleManualFindGameDataDir}
          />
        </div>
      </div>
      <div className={classes.actions}>
        <Locale
          component={Button}
          mapping={['components.accounts.facetView.addOrEditForm.cancelBtn']}
          appearance="secondary"
          disabled={isSubmitting}
          onClick={onCancel}
        />
        <Locale
          component={Button}
          mapping={['components.accounts.facetView.addOrEditForm.submitBtn']}
          appearance="primary"
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
        />
      </div>
    </form>
  )
}
