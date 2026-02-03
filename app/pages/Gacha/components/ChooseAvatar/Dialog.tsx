import { MouseEventHandler, forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { Button, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger, Image, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { CheckmarkCircleRegular, DismissRegular } from '@fluentui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { produce } from 'immer'
import { useImmer } from 'use-immer'
import MetadataCommands from '@/api/commands/metadata'
import { Account, AccountBusiness, KeyofAccountBusiness } from '@/api/schemas/Account'
import BusinessImages from '@/assets/images/BusinessImages'
import { WithTrans, WithTransKnownNs, useI18n, withTrans } from '@/i18n'
import GachaImage from '@/pages/Gacha/components/Image'
import { ItemCategory } from '@/pages/Gacha/contexts/PrettizedRecords'
import { useUpdateAccountPropertiesMutation } from '@/pages/Gacha/queries/accounts'
import useAppNotifier from '@/pages/Root/hooks/useAppNotifier'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    height: 'fit-content',
    overflow: 'hidden',
  },
  avatars: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexGrow: 1,
    overflowY: 'auto',
    height: '24rem',
    minHeight: 0,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalS}`,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    boxShadow: tokens.shadow2,
  },
  avatarWrapper: {
    minWidth: 'unset',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '4rem',
    height: '4rem',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground6,
    border: `${tokens.strokeWidthThickest} solid ${tokens.colorNeutralStroke1}`,
    '& img': {
      width: '100%',
      height: '100%',
      borderRadius: tokens.borderRadiusCircular,
      backgroundColor: tokens.colorNeutralBackground6,
    },
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '10rem',
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXL,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  previewAvatar: {
    width: '7.5rem',
    height: '7.5rem',
  },
  previewAvatarName: {
    maxWidth: '80%',
  },
  confirm: {},
})

export interface ChooseAvatarProps {
  business: AccountBusiness
  owner: Account
  onSuccess?: MouseEventHandler
}

function useChooseAvatar ({
  t, business, owner, onSuccess,
}:
  & Pick<WithTrans, 't'>
  & Pick<ChooseAvatarProps, 'business' | 'owner' | 'onSuccess'>,
) {
  const [activeAvatar, setActiveAvatar] = useState(owner.properties?.avatarId)
  const availableAvatarsQuery = useQuery({
    staleTime: 60 * 1000, // 60s
    queryKey: ['ChooseAvatar', 'Dialog', AccountBusiness[business]],
    queryFn: async function availableAvatarsFn () {
      const entries = await MetadataCommands.entries({
        business,
        category: ItemCategory.Character,
      })

      // Desc
      entries?.sort((a, b) => b - a)
      return entries
    },
  })

  const handleAvatarChange = useCallback<MouseEventHandler<HTMLButtonElement>>((evt) => {
    const value = evt.currentTarget.value as string | undefined
    if (value) {
      setActiveAvatar(value)
    }
  }, [])

  const notifier = useAppNotifier()
  const updateAccountPropertiesMutation = useUpdateAccountPropertiesMutation()
  const handleConfirm = useCallback<MouseEventHandler>(async (evt) => {
    if (!activeAvatar) {
      return
    }

    const properties = Object.assign({}, owner.properties)
    await updateAccountPropertiesMutation.mutateAsync({
      business,
      uid: owner.uid,
      properties: produce(properties, (draft) => {
        draft.avatarId = activeAvatar
      }),
    })

    onSuccess?.(evt)
    notifier.success(t('ChooseAvatar.Dialog.Success'))
  }, [activeAvatar, business, notifier, onSuccess, owner.properties, owner.uid, t, updateAccountPropertiesMutation])

  return {
    activeAvatar,
    availableAvatarsQuery,
    handleAvatarChange,
    handleConfirm,
    confirmDisabled: !activeAvatar || updateAccountPropertiesMutation.isPending,
  }
}

const ChooseAvatarInner = withTrans.GachaPage(function ChooseAvatarInner (
  { t, business, owner, onSuccess }: WithTrans & ChooseAvatarProps,
) {
  const styles = useStyles()
  const keyof = AccountBusiness[business] as KeyofAccountBusiness
  const {
    activeAvatar,
    availableAvatarsQuery,
    handleAvatarChange,
    handleConfirm,
    confirmDisabled,
  } = useChooseAvatar({ t, business, owner, onSuccess })

  return (
    <DialogContent className={styles.root}>
      <div className={styles.avatars}>
        {availableAvatarsQuery.data?.map((avatar) => (
          <Button
            className={styles.avatarWrapper}
            key={avatar}
            value={avatar}
            onClick={handleAvatarChange}
            appearance={String(avatar) === activeAvatar ? 'primary' : 'subtle'}
          >
            <div className={styles.avatar}>
              <GachaImage
                keyof={keyof}
                itemId={avatar}
                itemCategory={ItemCategory.Character}
              />
            </div>
          </Button>
        ))}
      </div>
      <div className={styles.actions}>
        <div className={styles.preview}>
          <div className={mergeClasses(styles.avatar, styles.previewAvatar)}>
            {activeAvatar
              ? (
                  <GachaImage
                    keyof={keyof}
                    itemId={Number(activeAvatar)}
                    itemCategory={ItemCategory.Character}
                  />
                )
              : (
                  <Image src={BusinessImages[keyof].Material!.Icon!} />
                )}
          </div>
          <div className={styles.previewAvatarName}>
            {owner.properties?.displayName}
          </div>
        </div>
        <div className={styles.confirm}>
          <Button
            onClick={handleConfirm}
            disabled={confirmDisabled}
            icon={<CheckmarkCircleRegular />}
            appearance="primary"
            size="large"
          >
            {t('ChooseAvatar.Dialog.Confirm')}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
})

const useDialogStyles = makeStyles({
  surface: {
    maxWidth: '40rem',
    paddingRight: 0,
  },
  dismiss: {
    paddingRight: tokens.spacingHorizontalXL,
  },
})

const ChooseAvatarDialog = forwardRef<
  { open (owner: Account): void },
  Omit<ChooseAvatarProps, 'owner' | 'onCancel' | 'onSuccess'>
>(function ChooseAvatarDialog (props, ref) {
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

  const styles = useDialogStyles()
  const { t } = useI18n(WithTransKnownNs.GachaPage)

  if (!owner) {
    return null
  }

  return (
    <Dialog
      modalType="alert"
      open={open}
      onOpenChange={(_, data) => produceState((draft) => {
        draft.open = data.open
      })}
    >
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle action={{
            className: styles.dismiss,
            children: (
              <DialogTrigger action="close">
                <Button appearance="subtle" icon={<DismissRegular />} />
              </DialogTrigger>
            ),
          }}
          >
            {t('ChooseAvatar.Dialog.Title', {
              identity: owner.properties?.displayName || owner.uid,
            })}
          </DialogTitle>
          <ChooseAvatarInner
            {...props}
            owner={owner}
            onSuccess={() => produceState((draft) => {
              draft.open = false
            })}
          />
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
})

export default ChooseAvatarDialog
