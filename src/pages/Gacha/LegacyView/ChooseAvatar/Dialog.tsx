import React, { ForwardRefRenderFunction, MouseEventHandler, Suspense, forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react'
import { Button, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger, Image, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { CheckmarkCircleRegular, DismissRegular } from '@fluentui/react-icons'
import { Await } from '@tanstack/react-router'
import { produce } from 'immer'
import { gachaMetadataItemNameFromId } from '@/api/commands/business'
import { useUpdateAccountPropertiesMutation } from '@/api/queries/accounts'
import BizImages from '@/components/BizImages'
import Locale from '@/components/Locale'
import useBusinessContext from '@/hooks/useBusinessContext'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import { Account } from '@/interfaces/Account'
import { Business, Businesses, ReversedBusinesses } from '@/interfaces/Business'

const useStyles = makeStyles({
  surface: {
    maxWidth: '40rem',
    paddingRight: 0,
  },
  titleAction: {
    paddingRight: tokens.spacingHorizontalXL,
  },
})

interface Props {
  account: Account | null
}

const GachaLegacyViewChooseAvatarDialog: ForwardRefRenderFunction<{ setOpen (value: boolean): void }, Props> = (
  props,
  ref,
) => {
  const { account } = props
  const styles = useStyles()
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    setOpen,
  }), [])

  if (!account) {
    return null
  }

  return (
    <Dialog
      modalType="alert"
      open={open}
      onOpenChange={(_, data) => setOpen(data.open)}
    >
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <Locale
            component={DialogTitle}
            mapping={[
              'Pages.Gacha.LegacyView.ChooseAvatarDialog.Title',
              { identify: account.properties?.displayName || account.uid },
            ]}
            action={{
              className: styles.titleAction,
              children: (
                <DialogTrigger action="close">
                  <Button appearance="subtle" icon={<DismissRegular />} />
                </DialogTrigger>
              ),
            }}
          />
          <ChooseAvatarContent
            account={account}
            onSuccess={() => setOpen(false)}
          />
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export default forwardRef(GachaLegacyViewChooseAvatarDialog)

const useContentStyles = makeStyles({
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
    background: tokens.colorNeutralBackground2,
  },
  avatarWrapper: {
    minWidth: 'unset',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
    '&[data-checked="true"]': {
      background: tokens.colorBrandBackground2Pressed,
    },
  },
  avatar: {
    width: '4rem',
    height: '4rem',
    background: tokens.colorNeutralBackground6,
    borderRadius: tokens.borderRadiusCircular,
    border: `${tokens.strokeWidthThickest} solid ${tokens.colorNeutralStroke1}`,
    '& img': {
      width: '100%',
      height: '100%',
      background: tokens.colorNeutralBackground6,
      borderRadius: tokens.borderRadiusCircular,
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

function ChooseAvatarContent (props: { account: Account, onSuccess?: (avatarId: string) => void }) {
  const { account, onSuccess } = props
  const styles = useContentStyles()

  const { keyofBusinesses } = useBusinessContext()
  const avatars = useMemo(() => BizImages[keyofBusinesses].Character!, [keyofBusinesses])
  const [avatarId, setAvatarId] = useState(account.properties?.avatarId)
  const notifier = useNotifier()
  const i18n = useI18n()

  const handleSelect = useCallback<MouseEventHandler>((evt) => {
    const id = evt.currentTarget.getAttribute('data-id')
    if (id && avatars[id]) {
      setAvatarId(id)
    }
  }, [avatars])

  const updateAccountPropertiesMutation = useUpdateAccountPropertiesMutation()
  const handleConfirm = useCallback<MouseEventHandler>(async () => {
    if (avatarId) {
      const properties = { ...account.properties }
      await updateAccountPropertiesMutation.mutateAsync({
        business: account.business,
        uid: account.uid,
        properties: produce(properties, (draft) => {
          draft.avatarId = avatarId
        }),
      })

      onSuccess?.(avatarId)
      notifier.success(i18n.t(['Pages.Gacha.LegacyView.ChooseAvatarDialog.Success']))
    }
  }, [account, avatarId, i18n, notifier, onSuccess, updateAccountPropertiesMutation])

  return (
    <DialogContent className={styles.root}>
      <div className={styles.avatars}>
        {Object.entries(avatars).reverse().map(([id, src]) => (
          <Button
            key={id}
            className={styles.avatarWrapper}
            appearance={id === avatarId ? 'primary' : 'subtle'}
            onClick={handleSelect}
            data-id={id}
          >
            <div className={styles.avatar}>
              <Image src={src} />
            </div>
          </Button>
        ))}
      </div>
      <div className={styles.actions}>
        <div className={styles.preview}>
          <div className={mergeClasses(styles.avatar, styles.previewAvatar)}>
            <Image src={avatarId ? avatars[avatarId] : BizImages[keyofBusinesses].Material!.Icon!} />
          </div>
          <div className={styles.previewAvatarName}>
            <AvatarName account={account} avatarId={avatarId} locale={i18n.constants.gacha} />
          </div>
        </div>
        <div className={styles.confirm}>
          <Locale
            component={Button}
            icon={<CheckmarkCircleRegular />}
            onClick={handleConfirm}
            disabled={!avatarId || updateAccountPropertiesMutation.isPending}
            appearance="primary"
            size="large"
            mapping={['Pages.Gacha.LegacyView.ChooseAvatarDialog.Confirm']}
          />
        </div>
      </div>
    </DialogContent>
  )
}

function AvatarName ({ account, avatarId, locale }: {
  account: Account
  avatarId: string | null | undefined
  locale: string
}) {
  if (account.business === Businesses.HonkaiStarRail && avatarId && isTrailblazer(avatarId)) {
    return (
      <Locale
        mapping={account.properties?.displayName || [`Business.${ReversedBusinesses[account.business]}.Player.Name`]}
      />
    )
  } else if (avatarId) {
    return (
      <Suspense fallback={'\u00A0'}>
        <Await promise={mappingAvatarName(account.business, avatarId, locale)}>
          {(avatarName) => avatarName}
        </Await>
      </Suspense>
    )
  }
}

function isTrailblazer (avatarId: string) {
  // HACK: Current -> 8001 ~ 8008
  return +avatarId / 8000 >= 1
}

const MappingAvatarNameCaches: Record<Business, Record<string, Record<string, string | null>>> = {
  [Businesses.GenshinImpact]: {},
  [Businesses.HonkaiStarRail]: {},
  [Businesses.ZenlessZoneZero]: {},
}

async function mappingAvatarName (business: Business, avatarId: string, locale: string): Promise<string | null> {
  let cache: string | null
  if (typeof (cache = MappingAvatarNameCaches[business][locale]?.[avatarId]) !== 'undefined') {
    return cache
  }

  const itemName = await gachaMetadataItemNameFromId({
    business,
    itemId: +avatarId,
    locale,
  })

  ;(MappingAvatarNameCaches[business][locale] || (MappingAvatarNameCaches[business][locale] = {}))[avatarId] = itemName
  return itemName
}
