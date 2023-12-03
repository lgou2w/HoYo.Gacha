import React, { ReactNode } from 'react'
import { UseControllerProps, UseControllerReturn, useController } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Field, Input, Textarea } from '@fluentui/react-components'
import Locale from '@/components/Core/Locale'
import { LocaleProps, acceptLocale } from '@/components/Core/Locale/declares'
import { FormData } from './declares'

interface AddOrEditFormFieldProps extends UseControllerProps<FormData> {
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

export default function AddOrEditFormField (props: AddOrEditFormFieldProps) {
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
            ? <Locale mapping={['components.accounts.facetView.addOrEditForm.valid']} />
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
