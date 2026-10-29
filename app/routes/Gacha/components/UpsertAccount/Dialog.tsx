import { MouseEventHandler, forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle } from '@fluentui/react-components'
import { produce } from 'immer'
import { Account } from '@/api/Account'
import useWindowResizable from '@/hooks/useWindowResizable'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import useGlobalNotifier from '@/routes/Root/hooks/useGlobalNotifier'
import UpsertAccountForm, { UpsertAccountFormProps } from './Form'

export interface UpsertAccountDialogHandle {
  open (owner: Account | null): void
}

interface UpsertAccountDialogState {
  owner: Account | null
  open: boolean
}

const UpsertAccountDialog = forwardRef<
  UpsertAccountDialogHandle,
  Omit<UpsertAccountFormProps, 'owner' | 'onCancel' | 'onSuccess'>
>(function UpsertAccountDialog (props, ref) {
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'UpsertAccount.Dialog' })
  const { success: successNotify } = useGlobalNotifier()
  const business = useBusiness()
  const [state, setState] = useState<UpsertAccountDialogState>({
    owner: null,
    open: false,
  })

  const updateState = useCallback((recipe: (draft: UpsertAccountDialogState) => void) => {
    setState((prev) => produce(prev, recipe))
  }, [])

  useWindowResizable(!state.open)
  useImperativeHandle(ref, () => ({
    open (owner) {
      updateState((draft) => {
        draft.owner = owner
        draft.open = true
      })
    },
  }), [updateState])

  const handleCancel = useCallback<MouseEventHandler>(() => {
    updateState((draft) => {
      draft.open = false
    })
  }, [updateState])

  const modeContext = state.owner ? 'edit' : 'add'
  const handleSuccess = useCallback<NonNullable<UpsertAccountFormProps['onSuccess']>>((data) => {
    updateState((draft) => {
      draft.open = false
    })
    successNotify(t('Success', {
      context: modeContext,
      keyof: business.keyof,
      identity: data.properties?.displayName || data.uid,
    }))
  }, [business.keyof, modeContext, successNotify, t, updateState])

  return (
    <Dialog open={state.open} modalType="alert">
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {t('Title', {
              context: modeContext,
              keyof: business.keyof,
            })}
          </DialogTitle>
          <DialogContent>
            <UpsertAccountForm
              {...props}
              owner={state.owner}
              onCancel={handleCancel}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
})

export default UpsertAccountDialog
