import { MouseEventHandler } from 'react'
import { FieldPath, UseControllerProps, UseControllerReturn, useController } from 'react-hook-form'
import { Button, Field, FieldProps, Input, InputProps, Textarea, TextareaProps, makeStyles, tokens } from '@fluentui/react-components'
import { CursorHoverRegular, FolderSearchRegular, PersonTagRegular } from '@fluentui/react-icons'
import { Account } from '@/api/Account'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useAccount } from '@/routes/Gacha/contexts/Account/hooks'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import { DisplayNameMaxLength, UpsertAccountFormValues, useUpsertAccountForm } from './hooks'

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

export interface UpsertAccountFormProps {
  owner: Account | null
  onCancel?: MouseEventHandler
  onSuccess?: (data: Account) => void
}

const I18nScope = 'UpsertAccount.Form'

export default function UpsertAccountForm (props: UpsertAccountFormProps) {
  const { owner, onCancel, onSuccess } = props
  const styles = useStyles()

  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const business = useBusiness()
  const { accounts } = useAccount()
  const {
    control, formState, isEditMode, disabled, onSubmit,
    uidRules, displayNameRules, dataFolderRules,
    handleAutoFind, handleManualFind,
  } = useUpsertAccountForm({
    t,
    i18nScope: I18nScope,
    business: business.value,
    accounts,
    owner,
    onSuccess,
  })

  return (
    <form className={styles.root} onSubmit={onSubmit} noValidate>
      <InputField
        control={control}
        name="uid"
        label={t(`${I18nScope}.Uid.Label`)}
        placeholder={t(`${I18nScope}.Uid.Placeholder`)}
        validMessage={t(`${I18nScope}.ValidMessage`)}
        contentBefore={(
          <svg fill="currentColor" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 7V9H9V15H10V17H6V15H7V9H6V7H10M16 7C17.11 7 18 7.9 18 9V15C18 16.11 17.11 17 16 17H12V7M16 9H14V15H16V9Z" />
          </svg>
        )}
        rules={uidRules}
        disabled={isEditMode}
        required
      />
      <InputField
        control={control}
        name="displayName"
        label={t(`${I18nScope}.DisplayName.Label`)}
        placeholder={t(`${I18nScope}.DisplayName.Placeholder`)}
        validMessage={t(`${I18nScope}.ValidMessage`)}
        contentBefore={<PersonTagRegular />}
        contentAfter={({ field }) => {
          const length = field.value?.length
          return length ? `${length} / ${DisplayNameMaxLength}` : undefined
        }}
        rules={displayNameRules}
      />
      <div className={styles.dataFolderWrapper}>
        <TextareaField
          control={control}
          name="dataFolder"
          label={t(`${I18nScope}.DataFolder.Label`)}
          placeholder={t(`${I18nScope}.DataFolder.Placeholder`, { keyof: business.keyof })}
          validMessage={t(`${I18nScope}.ValidMessage`)}
          rules={dataFolderRules}
          rows={3}
          required
          readOnly
        />
        <div className={styles.dataFolderActions}>
          <Button
            className={styles.dataFolderAutoFind}
            icon={<FolderSearchRegular />}
            disabled={formState.isSubmitting}
            onClick={handleAutoFind}
            size="small"
          >
            {t(`${I18nScope}.DataFolder.AutoFind`)}
          </Button>
          <Button
            className={styles.dataFolderManualFind}
            icon={<CursorHoverRegular />}
            disabled={formState.isSubmitting}
            onClick={handleManualFind}
            size="small"
          >
            {t(`${I18nScope}.DataFolder.ManualFind`)}
          </Button>
        </div>
      </div>
      <div className={styles.actions}>
        <Button
          appearance="secondary"
          disabled={formState.isSubmitting}
          onClick={onCancel}
        >
          {t(`${I18nScope}.Cancel`)}
        </Button>
        <Button
          appearance="primary"
          disabled={disabled}
          type="submit"
        >
          {t(`${I18nScope}.Submit`)}
        </Button>
      </div>
    </form>
  )
}

// Field components

type FormValues = UpsertAccountFormValues

interface CommonFieldProps<T extends FieldPath<FormValues>> extends UseControllerProps<FormValues, T> {
  label?: FieldProps['label']
  validMessage?: string
  required?: boolean
  readOnly?: boolean
  disabled?: boolean
}

interface InputFieldProps<T extends FieldPath<FormValues>> extends CommonFieldProps<T> {
  placeholder?: InputProps['placeholder']
  contentBefore?:
    | InputProps['contentBefore']
    | ((controller: UseControllerReturn<FormValues>) => InputProps['contentBefore'])
  contentAfter?:
    | InputProps['contentAfter']
    | ((controller: UseControllerReturn<FormValues>) => InputProps['contentAfter'])

}

interface TextareaFieldProps<T extends FieldPath<FormValues>> extends CommonFieldProps<T> {
  placeholder?: TextareaProps['placeholder']
  rows?: TextareaProps['rows']
}

function useValidationDisplay (
  fieldState: UseControllerReturn<FormValues>['fieldState'],
  validMessage: string | undefined,
) {
  const isError = !!fieldState.error
  const isValid = fieldState.isDirty && !fieldState.invalid
  const validationMessage = isError
    ? fieldState.error!.message
    : isValid
      ? validMessage
      : undefined

  return { isError, isValid, validationMessage }
}

function InputField<T extends FieldPath<FormValues>> (props: InputFieldProps<T>) {
  const {
    label, placeholder, validMessage, required, readOnly,
    contentBefore, contentAfter, disabled,
    ...rest
  } = props

  // HACK: `disabled` is destructured out of `rest` to avoid a `setState`-during-render warning.
  //   See https://github.com/orgs/react-hook-form/discussions/10964
  const { field, fieldState, formState } = useController(rest)
  const { isError, isValid, validationMessage } = useValidationDisplay(fieldState, validMessage)

  const resolvedBefore = typeof contentBefore === 'function'
    ? contentBefore({ field, fieldState, formState })
    : contentBefore
  const resolvedAfter = typeof contentAfter === 'function'
    ? contentAfter({ field, fieldState, formState })
    : contentAfter

  return (
    <Field
      size="large"
      label={label}
      required={required}
      validationState={isError ? 'error' : isValid ? 'success' : 'none'}
      validationMessage={validationMessage}
    >
      <Input
        autoComplete="off"
        appearance="filled-darker"
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        disabled={disabled || formState.isSubmitting}
        contentBefore={resolvedBefore}
        contentAfter={resolvedAfter}
        {...field}
      />
    </Field>
  )
}

function TextareaField<T extends FieldPath<FormValues>> (props: TextareaFieldProps<T>) {
  const {
    label, placeholder, required, readOnly, validMessage,
    rows, disabled,
    ...rest
  } = props

  const { field, fieldState, formState } = useController(rest)
  const { isError, isValid, validationMessage } = useValidationDisplay(fieldState, validMessage)

  return (
    <Field
      size="large"
      label={label}
      required={required}
      validationState={isError ? 'error' : isValid ? 'success' : 'none'}
      validationMessage={validationMessage}
    >
      <Textarea
        autoComplete="off"
        appearance="filled-darker"
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
        disabled={disabled || formState.isSubmitting}
        rows={rows}
        {...field}
      />
    </Field>
  )
}
