import { ComponentProps, MouseEventHandler, useCallback } from 'react'
import { SubmitHandler, UseControllerProps, UseControllerReturn, useController, useForm } from 'react-hook-form'
import { Button, Field, FieldProps, Input, InputProps, Textarea, TextareaProps, makeStyles, tokens } from '@fluentui/react-components'
import { CursorHoverRegular, FolderSearchRegular, PersonTagRegular } from '@fluentui/react-icons'
import { produce } from 'immer'
import BusinessCommands, { DataFolder, LocateDataFolderFactory, LocateDataFolderFactoryKind } from '@/api/commands/business'
import errorTrans from '@/api/errorTrans'
import { Account, AccountBusiness, CreateAccountArgs, UpdateAccountDataFolderAndPropertiesArgs } from '@/api/schemas/Account'
import { WithTrans, withTrans } from '@/i18n'
import { useCreateAccountMutation, useUpdateAccountDataFolderAndPropertiesMutation } from '../../queries/accounts'

const DisplayNameMaxLength = 16

// https://doc.rust-lang.org/std/u32/constant.MAX.html
function isSafeU32 (n: number): boolean {
  return !Number.isNaN(n)
    && Number.isSafeInteger(n)
    && n >= 0
    && n <= 4_294_967_295
}

interface FormData {
  uid: string
  displayName: string | undefined
  dataFolder: Account['dataFolder']
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  dataFolderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  dataFolderActions: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  dataFolderAutoFind: {
    '&:not([disabled]), &:hover:active': {
      color: tokens.colorPaletteBerryForeground1,
      border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteBerryForeground1}`,
    },
  },
  dataFolderManualFind: {
    '&:not([disabled]), &:hover:active': {
      color: tokens.colorPaletteGreenForeground1,
      border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteGreenForeground1}`,
    },
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
  },
})

const DatasetLocateDataFolderFactory = 'data-factory'

export interface UpsertAccountFormProps {
  owner: Account | null
  business: AccountBusiness
  accounts: Account[]
  onCancel?: MouseEventHandler
  onSuccess?: (data: Account) => void
}

export default withTrans.GachaPage(function UpsertAccountForm (
  { t, owner, business, accounts, onCancel, onSuccess }:
    & WithTrans
    & UpsertAccountFormProps,
) {
  const styles = useStyles()
  const {
    control,
    formState: { isDirty, isValid, isSubmitting },
    handleSubmit,
    getFieldState,
    getValues,
    trigger,
    setError,
    setValue,
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      uid: '',
      displayName: '',
      dataFolder: '',
    },
    values: {
      uid: owner?.uid.toString() || '',
      displayName: owner?.properties?.displayName || '',
      dataFolder: owner?.dataFolder || '',
    },
  })

  const isEdit = !!owner
  const submitDisabled = isEdit
    ? !isDirty || !isValid || isSubmitting
    : !isValid || isSubmitting

  const handleLocateDataFolder = useCallback<MouseEventHandler>(async (evt) => {
    const factoryKind = evt.currentTarget.getAttribute(DatasetLocateDataFolderFactory) as LocateDataFolderFactoryKind | undefined
    if (!factoryKind) {
      return
    }

    // Check uid
    const uid = getValues('uid')
    if (!uid || getFieldState('uid').invalid) {
      trigger('uid', { shouldFocus: true })
      return
    }

    let factory: LocateDataFolderFactory
    if (factoryKind === LocateDataFolderFactoryKind.Manual) {
      factory = {
        [factoryKind]: {
          title: 'File dialog',
        },
      }
    } else {
      factory = { [factoryKind]: null }
    }

    let dataFolder: DataFolder<AccountBusiness>
    try {
      dataFolder = await BusinessCommands.locateDataFolder({
        business,
        uid: +uid, // SAFETY
        factory,
      })
    } catch (error) {
      const message = errorTrans(t, error)
      setError('dataFolder', { message }, { shouldFocus: true })
      return
    }

    setValue('dataFolder', dataFolder.value, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [business, getFieldState, getValues, setError, setValue, t, trigger])

  const createMutation = useCreateAccountMutation()
  const updateDataFolderAndPropertiesMutation = useUpdateAccountDataFolderAndPropertiesMutation()

  const handleUpsert = useCallback<SubmitHandler<FormData>>(async (data) => {
    const { uid, displayName, dataFolder } = data

    const edit = owner
    const args: CreateAccountArgs | UpdateAccountDataFolderAndPropertiesArgs = !edit
      // Create
      ? {
          business,
          uid: +uid,
          dataFolder,
          properties: displayName ? { displayName } : null,
        }
      // Update
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
      result = !edit
        ? await createMutation.mutateAsync(args)
        : await updateDataFolderAndPropertiesMutation.mutateAsync(args) || edit
    } catch (error) {
      const message = errorTrans(t, error)
      setError('uid', { message }, { shouldFocus: true })
      return
    }

    onSuccess?.(result)
  }, [business, createMutation, onSuccess, owner, setError, t, updateDataFolderAndPropertiesMutation])

  function tForm (subKey: string, options?: Parameters<typeof t>[2]) {
    return t(`UpsertAccount.Form.${subKey}`, options)
  }

  return (
    <form
      className={styles.root}
      onSubmit={handleSubmit(handleUpsert)}
      noValidate
    >
      <FormField
        component={Input}
        control={control}
        name="uid"
        label={tForm('Uid.Label')}
        placeholder={tForm('Uid.Placeholder')}
        validMessage={tForm('ValidMessage')}
        contentBefore={(
          <svg fill="currentColor" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 7V9H9V15H10V17H6V15H7V9H6V7H10M16 7C17.11 7 18 7.9 18 9V15C18 16.11 17.11 17 16 17H12V7M16 9H14V15H16V9Z" />
          </svg>
        )}
        rules={{
          required: tForm('Uid.Required'),
          async validate (value) {
            if (isEdit) {
              return
            }

            const uid = value && parseInt(value)
            const validated = uid && isSafeU32(uid)
              ? await BusinessCommands.validateUid({
                  business,
                  uid,
                })
              : null

            if (!validated) {
              return tForm('Uid.Pattern')
            }

            if (accounts.find((el) => el.uid === uid)) {
              return tForm('Uid.Exists')
            }
          },
        }}
        disabled={isEdit}
        required
      />
      <FormField
        component={Input}
        control={control}
        name="displayName"
        label={tForm('DisplayName.Label')}
        placeholder={tForm('DisplayName.Placeholder')}
        validMessage={tForm('ValidMessage')}
        contentBefore={<PersonTagRegular />}
        contentAfter={({ field }) => {
          const length = field.value?.length
          return length ? `${length} / ${DisplayNameMaxLength}` : undefined
        }}
        rules={{
          maxLength: {
            value: DisplayNameMaxLength,
            message: tForm('DisplayName.MaxLength'),
          },
        }}
      />
      <div className={styles.dataFolderWrapper}>
        <FormField
          component={Textarea}
          control={control}
          name="dataFolder"
          label={tForm('DataFolder.Label')}
          placeholder={tForm('DataFolder.Placeholder', { keyof: AccountBusiness[business] })}
          validMessage={tForm('ValidMessage')}
          rules={{
            required: tForm('DataFolder.Required'),
            deps: ['uid'],
          }}
          rows={3}
          required
          readOnly
        />
        <div className={styles.dataFolderActions}>
          <Button
            className={styles.dataFolderAutoFind}
            disabled={isSubmitting}
            onClick={handleLocateDataFolder}
            icon={<FolderSearchRegular />}
            {...{ [DatasetLocateDataFolderFactory]: LocateDataFolderFactoryKind.UnityLog }}
            size="small"
          >
            {tForm('DataFolder.AutoFind')}
          </Button>
          <Button
            className={styles.dataFolderManualFind}
            disabled={isSubmitting}
            onClick={handleLocateDataFolder}
            icon={<CursorHoverRegular />}
            {...{ [DatasetLocateDataFolderFactory]: LocateDataFolderFactoryKind.Manual }}
            size="small"
          >
            {tForm('DataFolder.ManualFind')}
          </Button>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          appearance="secondary"
          disabled={isSubmitting}
          onClick={onCancel}
        >
          {tForm('Cancel')}
        </Button>
        <Button
          appearance="primary"
          disabled={submitDisabled}
          type="submit"
        >
          {tForm('Submit')}
        </Button>
      </div>
    </form>
  )
})

// #region: Field

interface FormFieldProps<T extends typeof Input | typeof Textarea> extends UseControllerProps<FormData> {
  component: T
  label?: FieldProps['label']
  placeholder?: ComponentProps<T>['placeholder']
  required?: boolean
  readOnly?: boolean
  validMessage?: string
  contentBefore?: InputProps['contentBefore'] | ((controller: UseControllerReturn<FormData>) => InputProps['contentBefore'])
  contentAfter?: InputProps['contentAfter'] | ((controller: UseControllerReturn<FormData>) => InputProps['contentAfter'])
  rows?: TextareaProps['rows']
}

function FormField<T extends typeof Input | typeof Textarea> (props: FormFieldProps<T>) {
  const {
    component: Component,
    label,
    placeholder,
    required,
    readOnly,
    validMessage,
    contentBefore,
    contentAfter,
    rows,
    // HACK: https://github.com/orgs/react-hook-form/discussions/10964
    //   Warning: Cannot update a component (`UpsertAccountForm`) while rendering a different component (`FormField`). To locate the bad setState() call inside `FormField`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render
    //   Solution: https://github.com/orgs/react-hook-form/discussions/10964#discussioncomment-9610656
    disabled,
    ...rest
  } = props

  const { field, fieldState, formState } = useController(rest)

  const isError = !!fieldState.error
  const isValid = fieldState.isDirty && !fieldState.invalid
  const validationMessage = isError
    ? fieldState.error!.message
    : isValid
      ? validMessage
      : undefined

  let mContentBefore = contentBefore
  let mContentAfter = contentAfter
  if (Component === Input) {
    if (typeof contentBefore === 'function') {
      mContentBefore = contentBefore({ field, fieldState, formState })
    }
    if (typeof contentAfter === 'function') {
      mContentAfter = contentAfter({ field, fieldState, formState })
    }
  }

  return (
    <Field
      size="large"
      label={label}
      required={required}
      validationState={isError ? 'error' : isValid ? 'success' : 'none'}
      validationMessage={validationMessage}
    >
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <Component
        autoComplete="off"
        appearance="filled-darker"
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        disabled={disabled || formState.isSubmitting}
        {...{ contentBefore: mContentBefore, contentAfter: mContentAfter, rows }}
        {...field}
      />
    </Field>
  )
}

// #endregion
