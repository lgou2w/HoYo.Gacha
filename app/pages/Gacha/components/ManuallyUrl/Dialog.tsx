import { MouseEventHandler, forwardRef, useCallback, useImperativeHandle } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Button, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Textarea, makeStyles, tokens } from '@fluentui/react-components'
import { produce } from 'immer'
import { useImmer } from 'use-immer'
import BusinessCommands, { GachaUrl } from '@/api/commands/business'
import errorTrans from '@/api/errorTrans'
import { Account, AccountBusiness } from '@/api/schemas/Account'
import { WithTrans, WithTransKnownNs, useI18n } from '@/i18n'
import { useUpdateAccountPropertiesMutation } from '@/pages/Gacha/queries/accounts'
import useAppNotifier from '@/pages/Root/hooks/useAppNotifier'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
  },
})

export interface ManuallyUrlProps {
  business: AccountBusiness
  owner: Account
  onCancel?: MouseEventHandler
  onSuccess?: () => void
}

interface FormData { url: string }

// HACK: See -> crates/url_finder/src/lib.rs
const UrlRegex = /^https:\/\/.*(mihoyo.com|hoyoverse.com).*\?.*(authkey\=.+).*$/i
const UrlExample = 'https://*.mihoyo|hoyoverse.com/xxx?authkey=yourauthkey&fullQueryParamsGachaUrl'

function ManuallyUrlForm (props: Pick<WithTrans, 't'> & ManuallyUrlProps) {
  const styles = useStyles()
  const { t, business, owner, onCancel, onSuccess } = props
  const {
    formState: { errors, isValid, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<FormData>({
    mode: 'onChange',
  })

  const notifier = useAppNotifier()
  const updateAccountPropertiesMutation = useUpdateAccountPropertiesMutation()
  const handleConfirm = useCallback<SubmitHandler<FormData>>(async (data) => {
    const uid = owner.uid
    const properties = Object.assign({}, owner.properties)

    let gachaUrl: GachaUrl<AccountBusiness>
    try {
      gachaUrl = await BusinessCommands.fromDirtyGachaUrl({
        business,
        uid,
        dirty: data.url,
      })
    } catch (error) {
      const message = errorTrans(t, error)
      setError('url', { message })
      throw error
    }

    await updateAccountPropertiesMutation.mutateAsync({
      business,
      uid,
      properties: produce(properties, (draft) => {
        // The creation time of the dirty URL cannot be determined,
        // so it is set to null.
        draft.gachaUrl = gachaUrl.value
        draft.gachaUrlCreationTime = null
      }),
    })

    // Done
    onSuccess?.()
    notifier.success(t('ManuallyUrl.Form.Success'))
  }, [business, notifier, onSuccess, owner.properties, owner.uid, setError, t, updateAccountPropertiesMutation])

  return (
    <form
      className={styles.root}
      onSubmit={handleSubmit(handleConfirm)}
      noValidate
    >
      <Field
        validationMessage={errors.url ? errors.url.message : undefined}
        validationState={errors.url ? 'error' : isValid ? 'success' : 'none'}
        size="large"
        required
      >
        <Textarea
          placeholder={t('ManuallyUrl.Form.Placeholder', {
            example: UrlExample,
          })}
          appearance="filled-darker"
          autoComplete="off"
          rows={8}
          required
          {...register('url', {
            required: t('ManuallyUrl.Form.Required'),
            validate: (value) => {
              if (!value || !UrlRegex.test(value)) {
                return t('ManuallyUrl.Form.Validate')
              }
            },
          })}
        />
      </Field>
      <div className={styles.actions}>
        <Button
          onClick={onCancel}
          disabled={isSubmitting}
          appearance="secondary"
        >
          {t('ManuallyUrl.Form.Cancel')}
        </Button>
        <Button
          disabled={!isValid || isSubmitting}
          appearance="primary"
          type="submit"
        >
          {t('ManuallyUrl.Form.Submit')}
        </Button>
      </div>
    </form>
  )
}

const ManuallyUrlDialog = forwardRef<
  { open (owner: Account): void },
  Omit<ManuallyUrlProps, 'owner' | 'onCancel' | 'onSuccess'>
>(function ManuallyUrlDialog (props, ref) {
  const [{ owner, open }, produceState] = useImmer({
    owner: null as Account | null,
    open: false,
  })

  useImperativeHandle(ref, () => ({
    open: (owner) => produceState({
      owner,
      open: true,
    }),
  }), [produceState])

  const { t } = useI18n(WithTransKnownNs.GachaPage)
  const close = useCallback(() => {
    produceState((draft) => {
      draft.open = false
    })
  }, [produceState])

  if (!owner) {
    return null
  }

  return (
    <Dialog open={open} modalType="alert">
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {t('ManuallyUrl.Dialog.Title')}
          </DialogTitle>
          <DialogContent>
            <ManuallyUrlForm
              t={t}
              business={props.business}
              owner={owner}
              onCancel={close}
              onSuccess={close}
            />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
})

export default ManuallyUrlDialog
