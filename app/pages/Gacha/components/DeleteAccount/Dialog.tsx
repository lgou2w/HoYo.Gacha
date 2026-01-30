import { ChangeEvent, MouseEventHandler, forwardRef, useCallback, useImperativeHandle, useMemo } from 'react'
import { Button, Checkbox, CheckboxOnChangeData, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Input, Switch, makeStyles, tokens } from '@fluentui/react-components'
import { useImmer } from 'use-immer'
import { Account, AccountBusiness } from '@/api/schemas/Account'
import { WithTransKnownNs, useI18n } from '@/i18n'
import { useDeleteAccountWholeMutation } from '@/pages/Gacha/queries/accounts'

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  confirms: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
})

const DeleteAccountDialog = forwardRef<
  { open (owner: Account): void },
  { business: AccountBusiness }
>(function DeleteAccountDialog (props, ref) {
  const styles = useStyles()
  const [{ owner, open, whole, confirms }, produceState] = useImmer({
    owner: null as Account | null,
    open: false,
    whole: false,
    confirms: [false, false, false] as [boolean, boolean, boolean],
  })

  useImperativeHandle(ref, () => ({
    open: (owner) => produceState((draft) => {
      // Reset on open
      draft.whole = false
      draft.confirms = [false, false, false]

      draft.owner = owner
      draft.open = true
    }),
  }), [produceState])

  const { business } = props
  const { constants: { gacha }, t } = useI18n(WithTransKnownNs.GachaPage)

  const deleteAccountWholeMutation = useDeleteAccountWholeMutation()
  const handleDelete = useCallback<MouseEventHandler>(async () => {
    if (!owner) {
      return
    }

    // FIXME: Normally, this shouldn't throw an error,
    // but database errors are an exception.
    await deleteAccountWholeMutation.mutateAsync({
      business,
      uid: owner.uid,
      whole,
      customLocale: gacha,
    })

    // Done
    produceState((draft) => {
      draft.open = false
    })
  }, [business, deleteAccountWholeMutation, gacha, owner, produceState, whole])

  const handleConfirmChange = useCallback((evt: ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => {
    produceState((draft) => {
      const indexData = evt.target.getAttribute('data-index')
      if (!indexData) {
        return
      }

      const index = +indexData
      const checked = data.checked as boolean

      draft.confirms[index] = checked
      if (!checked) {
        for (let i = index + 1; i < draft.confirms.length; i++) {
          draft.confirms[i] = false
        }
      }
    })
  }, [produceState])

  const visibleConfirms = useMemo(() => {
    if (!whole) {
      return 0
    }

    const firstUncheckedIndex = confirms.findIndex((checked) => !checked)
    if (firstUncheckedIndex === -1) {
      return confirms.length
    } else {
      return Math.min(firstUncheckedIndex + 1, confirms.length)
    }
  }, [confirms, whole])

  const uid = owner?.uid
  const displayName = owner?.properties?.displayName

  const busy = deleteAccountWholeMutation.isPending
  const submitDisabled = busy || (whole && !confirms.every((checked) => checked))

  return (
    <Dialog modalType="alert" open={open}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {t('DeleteAccount.Dialog.Title', {
              keyof: AccountBusiness[business],
            })}
          </DialogTitle>
          <DialogContent className={styles.content}>
            <Field label={t('DeleteAccount.Dialog.Uid')} orientation="horizontal">
              <Input appearance="filled-darker" value={String(uid)} readOnly />
            </Field>
            {displayName && (
              <Field label={t('DeleteAccount.Dialog.DisplayName')} orientation="horizontal">
                <Input appearance="filled-darker" value={displayName} readOnly />
              </Field>
            )}
            <Field
              label={t('DeleteAccount.Dialog.Whole.Label')}
              validationMessage={t('DeleteAccount.Dialog.Whole.Information')}
              validationState="error"
              orientation="horizontal"
            >
              <Switch
                checked={whole}
                disabled={busy}
                onChange={(_, data) => produceState((draft) => {
                  draft.whole = data.checked

                  // Reset confirms
                  if (!data.checked) {
                    draft.confirms = [false, false, false]
                  }
                })}
              />
            </Field>
            {whole && (
              <div className={styles.confirms}>
                {Array.from({ length: visibleConfirms }).map((_, index) => (
                  <Checkbox
                    key={`Confirm-${index}`}
                    label={t(`DeleteAccount.Dialog.Confirm.${index + 1}`)}
                    checked={confirms[index]}
                    onChange={handleConfirmChange}
                    disabled={(index > 0 && !confirms[index - 1]) || busy}
                    data-index={index}
                  />
                ))}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              appearance="secondary"
              disabled={busy}
              onClick={() => produceState((draft) => {
                draft.open = false
              })}
            >
              {t('DeleteAccount.Dialog.Cancel')}
            </Button>
            <Button
              appearance="primary"
              disabled={submitDisabled}
              onClick={handleDelete}
            >
              {t('DeleteAccount.Dialog.Submit')}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
})

export default DeleteAccountDialog
