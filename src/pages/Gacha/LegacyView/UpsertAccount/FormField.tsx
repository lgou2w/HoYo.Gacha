import React, { ReactNode } from 'react'
import { UseControllerProps, UseControllerReturn, useController } from 'react-hook-form'
import { Field, Input, Textarea } from '@fluentui/react-components'
import Locale, { LocaleProps, UseI18nResponse } from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { UpsertAccountFormData } from './declares'

interface Props extends UseControllerProps<UpsertAccountFormData> {
  component: typeof Input | typeof Textarea
  labelMapping: LocaleProps['mapping']
  placeholderMapping: Parameters<UseI18nResponse['t']>
  required?: boolean
  readOnly?: boolean

  // Input only
  before?: ReactNode | ((controller: UseControllerReturn<UpsertAccountFormData>) => ReactNode)
  after?: ReactNode | ((controller: UseControllerReturn<UpsertAccountFormData>) => ReactNode)

  // Textarea only
  rows?: number
}

export default function UpsertAccountFormField (props: Props) {
  const i18n = useI18n()
  const {
    component: Component,
    labelMapping,
    placeholderMapping,
    required,
    readOnly,
    before,
    after,
    rows,
    // HACK: https://github.com/orgs/react-hook-form/discussions/10964
    //   Warning: Cannot update a component (`UpsertAccountForm`) while rendering a different component (`UpsertAccountFormField`). To locate the bad setState() call inside `UpsertAccountFormField`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render
    //   Solution: https://github.com/orgs/react-hook-form/discussions/10964#discussioncomment-9610656
    disabled,
    ...rest
  } = props

  const { field, fieldState, formState } = useController({
    ...rest,
  })

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
            ? <Locale mapping={['Pages.Gacha.LegacyView.UpsertAccountForm.Valid']} />
            : undefined
      }
      required={required}
    >
      <Component
        autoComplete="off"
        appearance="filled-darker"
        placeholder={i18n.t(...placeholderMapping)}
        required={required}
        readOnly={readOnly}
        disabled={disabled || formState.isSubmitting}
        {...(Component === Input
          ? {
              contentBefore: { children: contentBefore },
              contentAfter: { children: contentAfter },
            }
          : Component === Textarea
            ? { rows }
            : undefined
        )}
        {...field}
      />
    </Field>
  )
}
