import React, { ReactNode, useCallback } from 'react'
import { useForm, SubmitHandler, UseControllerProps, useController, UseControllerReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Field, Input, Textarea, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { CursorHoverRegular, FolderSearchRegular, PersonTagRegular } from '@fluentui/react-icons'
import { dialog } from '@tauri-apps/api'
import { Account, UidRegex, isCorrectUid, isOverseaServer } from '@/api/interfaces/account'
import { DataDirectory } from '@/api/interfaces/gacha-facet'
import { GachaFacetPlugin, isDatabaseError, isGachaFacetError, stringifyGachaFacetErrorKind } from '@/api/plugins'
import { useAccountsQuery, useCreateAccountMutation } from '@/api/queries/account'
import Locale from '@/components/Core/Locale'
import { LocaleProps, acceptLocale } from '@/components/Core/Locale/declares'
import useToaster from '@/components/Core/Toaster/useToaster'
import useAccountsFacetView from '@/components/Routes/Accounts/FacetView/useAccountsFacetView'
import { IdentifierRegular } from '@/components/Utilities/Icons'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS
  },
  gameDataDir: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalS,
    '> .btns': {
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
  onCancel?: () => void
  onSuccess?: (account: Account) => void
}

interface FormData {
  uid: string
  displayName?: string
  gameDataDir: string
}

const DisplayNameMaxLength = 16

export default function CreateAccountDialogForm (props: Props) {
  const { onCancel, onSuccess } = props
  const { keyOfFacets, facet } = useAccountsFacetView()
  const { data } = useAccountsQuery()
  const { notifyLocale } = useToaster()
  const { t } = useTranslation()

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
        message: t('components.routes.accounts.facetView.createAccountDialog.form.gameDataDir.emptyFind')
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
      title: t('components.routes.accounts.facetView.createAccountDialog.form.gameDataDir.manualFindTitle')
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
  const onSubmit = useCallback<SubmitHandler<FormData>>(async (data) => {
    let account: Account
    try {
      account = await createAccountMutation.mutateAsync({
        facet,
        uid: parseInt(data.uid),
        gameDataDir: data.gameDataDir,
        properties: data.displayName
          ? { displayName: data.displayName }
          : undefined
      })
    } catch (e) {
      let message: string
      if (isDatabaseError(e)) {
        message = e.code === '2067'
          ? t('components.routes.accounts.facetView.createAccountDialog.form.uid.alreadyExists')
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
      'components.routes.accounts.facetView.createAccountDialog.form.success',
      { uid: account.uid }
    ], { intent: 'success' })
  }, [onSuccess, notifyLocale, createAccountMutation, facet, setError, t])

  const classes = useStyles()
  return (
    <form
      className={classes.root}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <CreateAccountDialogFormField
        name="uid"
        control={control}
        rules={{
          required: {
            value: true,
            message: t('components.routes.accounts.facetView.createAccountDialog.form.uid.required')
          },
          pattern: {
            value: UidRegex,
            message: t('components.routes.accounts.facetView.createAccountDialog.form.uid.pattern')
          },
          validate (value) {
            if (value && data?.find((v) => v.uid === +value)) {
              return t('components.routes.accounts.facetView.createAccountDialog.form.uid.alreadyExists')
            }
          }
        }}
        component={Input}
        labelMapping={['components.routes.accounts.facetView.createAccountDialog.form.uid.label']}
        placeholderMapping={['components.routes.accounts.facetView.createAccountDialog.form.uid.placeholder']}
        before={<IdentifierRegular />}
        required
      />
      <CreateAccountDialogFormField
        name="displayName"
        control={control}
        rules={{
          maxLength: {
            value: DisplayNameMaxLength,
            message: t('components.routes.accounts.facetView.createAccountDialog.form.displayName.length')
          }
        }}
        component={Input}
        labelMapping={['components.routes.accounts.facetView.createAccountDialog.form.displayName.label']}
        placeholderMapping={['components.routes.accounts.facetView.createAccountDialog.form.displayName.placeholder']}
        before={<PersonTagRegular />}
        after={({ field }) => {
          const length = field.value?.length
          return length ? `${length} / ${DisplayNameMaxLength}` : undefined
        }}
      />
      <div className={classes.gameDataDir}>
        <CreateAccountDialogFormField
          name="gameDataDir"
          control={control}
          rules={{
            required: {
              value: true,
              message: t('components.routes.accounts.facetView.createAccountDialog.form.gameDataDir.required')
            }
          }}
          component={Textarea}
          labelMapping={['components.routes.accounts.facetView.createAccountDialog.form.gameDataDir.label']}
          placeholderMapping={[
            'components.routes.accounts.facetView.createAccountDialog.form.gameDataDir.placeholder',
            { facet: keyOfFacets }
          ]}
          required
          readOnly
          rows={3}
        />
        <div className="btns">
          <Locale
            className="btn-auto-find"
            appearance="secondary"
            component={Button}
            mapping={['components.routes.accounts.facetView.createAccountDialog.form.gameDataDir.autoFindBtn']}
            size="small"
            icon={<FolderSearchRegular />}
            disabled={isSubmitting}
            onClick={handleAutoFindGameDataDir}
          />
          <Locale
            className="btn-manual-find"
            appearance="secondary"
            component={Button}
            mapping={['components.routes.accounts.facetView.createAccountDialog.form.gameDataDir.manualFindBtn']}
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
          mapping={['components.routes.accounts.facetView.createAccountDialog.cancelBtn']}
          appearance="secondary"
          disabled={isSubmitting}
          onClick={onCancel}
        />
        <Locale
          component={Button}
          mapping={['components.routes.accounts.facetView.createAccountDialog.submitBtn']}
          appearance="primary"
          type="submit"
          disabled={!isDirty || !isValid || isSubmitting}
        />
      </div>
    </form>
  )
}

interface CreateAccountDialogFormFieldProps extends UseControllerProps<FormData> {
  component: typeof Input | typeof Textarea
  labelMapping: LocaleProps['mapping']
  placeholderMapping: LocaleProps['mapping']
  required?: boolean
  readOnly?: boolean

  // Input only
  before?: ReactNode | ((controller: UseControllerReturn<FormData>) => ReactNode)
  after?: ReactNode | ((controller: UseControllerReturn<FormData>) => ReactNode)

  // Textarea only
  rows?: number
}

function CreateAccountDialogFormField (props: CreateAccountDialogFormFieldProps) {
  const { t } = useTranslation()
  const {
    component: Component,
    labelMapping,
    placeholderMapping,
    required,
    readOnly,
    before,
    after,
    rows,
    ...rest
  } = props

  const { field, fieldState, formState } = useController({ ...rest })

  let contentBefore: ReactNode
  let contentAfter: ReactNode
  if (Component === Input) {
    contentBefore = typeof before === 'function'
      ? before({ field, fieldState, formState })
      : before
    contentAfter = typeof after === 'function'
      ? after({ field, fieldState, formState })
      : after
  }

  const isError = !!fieldState.error
  const isValid = fieldState.isDirty && !fieldState.invalid

  return (
    <Field
      size="large"
      label={<Locale mapping={labelMapping} />}
      validationState={isError ? 'error' : isValid ? 'success' : 'none'}
      validationMessage={
        isError
          ? fieldState.error!.message
          : isValid
            ? <Locale mapping={['components.routes.accounts.facetView.createAccountDialog.form.valid']} />
            : undefined
      }
      required={required}
    >
      <Component
        autoComplete="off"
        appearance="filled-darker"
        placeholder={acceptLocale(t, placeholderMapping)}
        required={required}
        readOnly={readOnly}
        {...(Component === Input
          ? {
              contentBefore: { children: contentBefore },
              contentAfter: { children: contentAfter }
            }
          : Component === Textarea
            ? { rows }
            : undefined
        )}
        {...field}
        disabled={field.disabled || formState.isSubmitting}
      />
    </Field>
  )
}
