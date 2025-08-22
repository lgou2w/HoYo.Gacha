import React, { ElementRef, Fragment, MouseEventHandler, forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Body1Strong, Button, Caption1, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Input, Menu, MenuButton, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuItemRadio, MenuList, MenuListProps, MenuPopover, MenuSplitGroup, MenuTrigger, Switch, makeStyles, menuItemClassNames, tokens } from '@fluentui/react-components'
import { PeopleListRegular, PersonAddRegular, PersonCircleRegular, PersonDeleteRegular, PersonEditRegular } from '@fluentui/react-icons'
import { useImmer } from 'use-immer'
import { deleteGachaRecordsByBusinessAndUid } from '@/api/commands/database'
import { useAccountsSuspenseQueryData, useDeleteAccountMutation, useSelectedAccountSuspenseQueryData, useUpdateSelectedAccountUidMutation } from '@/api/queries/accounts'
import { removeFirstGachaRecordQuery, removePrettizedGachaRecordsQuery } from '@/api/queries/business'
import BizImages from '@/components/BizImages'
import Locale from '@/components/Locale'
import useBusinessContext from '@/hooks/useBusinessContext'
import useI18n from '@/hooks/useI18n'
import type { Account } from '@/interfaces/Account'
import { Business, KeyofBusinesses, ReversedBusinesses } from '@/interfaces/Business'
import ChooseAvatarDialog from '@/pages/Gacha/LegacyView/ChooseAvatar/Dialog'
import UpsertAccountDialog from '@/pages/Gacha/LegacyView/UpsertAccount/Dialog'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  label: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
  },
  content: {
    height: '2.5rem',
    minWidth: `calc(10.625rem + (${tokens.spacingHorizontalXS} * 2) + 4px)`,
  },
})

export default function GachaLegacyViewToolbarAccount () {
  const styles = useStyles()

  const { business, keyofBusinesses } = useBusinessContext()
  const accounts = useAccountsSuspenseQueryData(keyofBusinesses)

  const addAccountDialogRef = useRef<ElementRef<typeof UpsertAccountDialog>>(null)
  const handleAddAccountClick = useCallback<MouseEventHandler>(() => {
    addAccountDialogRef.current?.setOpen(true)
  }, [])

  return (
    <div className={styles.root}>
      <div className={styles.label}>
        <PeopleListRegular />
        <Locale
          component={Caption1}
          mapping={['Pages.Gacha.LegacyView.Toolbar.Account.Title']}
        />
      </div>
      <div className={styles.content}>
        <AccountList
          business={business}
          keyofBusinesses={keyofBusinesses}
          accounts={accounts}
          onAddAccountClick={handleAddAccountClick}
        />
        <UpsertAccountDialog
          ref={addAccountDialogRef}
          business={business}
          keyofBusinesses={keyofBusinesses}
          accounts={accounts}
        />
      </div>
    </div>
  )
}

const useAccountListStyle = makeStyles({
  menuBtn: {
    height: 'inherit',
    width: '100%',
    padding: 0,
    margin: 0,
    border: 'none',
    justifyContent: 'space-between',
  },
  menuList: {
    [`& .${menuItemClassNames.root}`]: {
      '&[aria-checked="true"]': {
        color: tokens.colorBrandBackground,
      },
    },
  },
  addAccountBtn: {
    fontSize: tokens.fontSizeBase200,
  },
  accountOptionsDelete: {
    color: tokens.colorStatusDangerForeground1,
    [`:hover, &:hover .${menuItemClassNames.icon}`]: {
      color: tokens.colorStatusDangerForeground1,
    },
  },
})

interface AccountListProps {
  business: Business
  keyofBusinesses: KeyofBusinesses
  accounts: Account[]
  onAddAccountClick: MouseEventHandler
}

function AccountList (props: AccountListProps) {
  const styles = useAccountListStyle()
  const { business, keyofBusinesses, accounts, onAddAccountClick } = props

  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const updateSelectedAccountUidMutation = useUpdateSelectedAccountUidMutation()
  const handleAccountSelect = useCallback<Required<MenuListProps>['onCheckedValueChange']>(async (_, data) => {
    if (data.name === 'account') {
      const targetUid = +data.checkedItems[0]
      if (targetUid === selectedAccount?.uid) {
        return
      }

      await updateSelectedAccountUidMutation.mutateAsync({
        business,
        data: accounts.find((el) => el.uid === targetUid)?.uid ?? null,
      })
    }
  }, [accounts, business, selectedAccount?.uid, updateSelectedAccountUidMutation])

  const editAccountDialogRef = useRef<ElementRef<typeof UpsertAccountDialog>>(null)
  const chooseAvatarDialogRef = useRef<ElementRef<typeof ChooseAvatarDialog>>(null)
  const deleteAccountDialogRef = useRef<ElementRef<typeof DeleteAccountDialog>>(null)
  const [activeAccount, setActiveAccount] = useState<Account | null>(null)
  const handleActiveAccountClick = useCallback<MouseEventHandler>((evt) => {
    const operation = evt.currentTarget.getAttribute('data-operation')
    const targetUid = evt.currentTarget.getAttribute('data-account')
    const target = targetUid && accounts.find((el) => el.uid === +targetUid)
    if (operation && target) {
      setActiveAccount(target)
      switch (operation) {
        case 'edit':
          editAccountDialogRef.current?.setOpen(true)
          break
        case 'choose-avatar':
          chooseAvatarDialogRef.current?.setOpen(true)
          break
        case 'delete':
          deleteAccountDialogRef.current?.setOpen(true)
          break
      }
    }
  }, [accounts])

  return (
    <Fragment>
      <Menu
        positioning={{ offset: { crossAxis: 0, mainAxis: 8 } }}
        checkedValues={{ account: selectedAccount ? [String(selectedAccount.uid)] : [] }}
        onCheckedValueChange={handleAccountSelect}
      >
        <MenuTrigger disableButtonEnhancement>
          <MenuButton className={styles.menuBtn} appearance="transparent" size="large">
            <AccountItem
              keyofBusinesses={keyofBusinesses}
              account={selectedAccount}
            />
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList className={styles.menuList}>
            {accounts.length > 0 && (
              <Fragment>
                <Locale
                  component={MenuGroupHeader}
                  mapping={['Pages.Gacha.LegacyView.Toolbar.Account.Available']}
                />
                <MenuGroup>
                  {accounts.map((account) => (
                    <Menu key={account.uid} openOnHover={false}>
                      <MenuSplitGroup>
                        <MenuItemRadio
                          name="account"
                          value={String(account.uid)}
                        >
                          <AccountItem
                            keyofBusinesses={keyofBusinesses}
                            account={account}
                          />
                        </MenuItemRadio>
                        <MenuTrigger disableButtonEnhancement>
                          <MenuItem />
                        </MenuTrigger>
                      </MenuSplitGroup>
                      <MenuPopover>
                        <MenuList>
                          <Locale
                            component={MenuGroupHeader}
                            mapping={['Pages.Gacha.LegacyView.Toolbar.Account.Options.Title']}
                          />
                          <MenuGroup>
                            <Locale
                              component={MenuItem}
                              icon={<PersonEditRegular />}
                              onClick={handleActiveAccountClick}
                              data-account={String(account.uid)}
                              data-operation="edit"
                              mapping={['Pages.Gacha.LegacyView.Toolbar.Account.Options.Edit']}
                            />
                            <Locale
                              component={MenuItem}
                              icon={<PersonCircleRegular />}
                              onClick={handleActiveAccountClick}
                              data-account={String(account.uid)}
                              data-operation="choose-avatar"
                              mapping={['Pages.Gacha.LegacyView.Toolbar.Account.Options.ChooseAvatar']}
                            />
                            <MenuDivider />
                            <Locale
                              component={MenuItem}
                              className={styles.accountOptionsDelete}
                              icon={<PersonDeleteRegular />}
                              onClick={handleActiveAccountClick}
                              data-account={String(account.uid)}
                              data-operation="delete"
                              mapping={['Pages.Gacha.LegacyView.Toolbar.Account.Options.Delete']}
                            />
                          </MenuGroup>
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                  ))}
                </MenuGroup>
                <MenuDivider />
              </Fragment>
            )}
            <MenuGroup>
              <Locale
                component={MenuItem}
                className={styles.addAccountBtn}
                onClick={onAddAccountClick}
                icon={<PersonAddRegular />}
                mapping={['Pages.Gacha.LegacyView.Toolbar.Account.AddNewAccount']}
              />
            </MenuGroup>
          </MenuList>
        </MenuPopover>
      </Menu>
      <UpsertAccountDialog
        ref={editAccountDialogRef}
        business={business}
        keyofBusinesses={keyofBusinesses}
        accounts={accounts}
        edit={activeAccount}
      />
      <ChooseAvatarDialog
        ref={chooseAvatarDialogRef}
        account={activeAccount}
      />
      <DeleteAccountDialog
        ref={deleteAccountDialogRef}
        account={activeAccount}
      />
    </Fragment>
  )
}

const useDeleteAccountDialogStyles = makeStyles({
  root: {
    maxWidth: '32rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingHorizontalS,
  },
})

const InitTimeoutCount = 10
const DeleteAccountDialog = forwardRef<{
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}, {
  account: Account | null
}>(function DeleteAccountDialog (props, ref) {
  const styles = useDeleteAccountDialogStyles()
  const { account } = props
  const [state, produce] = useImmer({
    open: false,
    timeoutCount: InitTimeoutCount,
    busy: false,
  })

  useImperativeHandle(ref, () => ({
    setOpen () {
      produce((draft) => {
        draft.open = true
      })
    },
  }))

  useEffect(() => {
    if (!account || !state.open) return

    produce((draft) => {
      draft.timeoutCount = InitTimeoutCount
    })

    const timer = setInterval(() => {
      produce((draft) => {
        if (draft.timeoutCount - 1 <= 0) {
          clearInterval(timer)
          draft.timeoutCount = 0
        } else {
          draft.timeoutCount -= 1
        }
      })
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [account, produce, state.open])

  const i18n = useI18n()
  const deleteAccountMutation = useDeleteAccountMutation()
  const wholeRef = useRef<ElementRef<typeof Switch>>(null)
  const handleSubmit = useCallback<MouseEventHandler>(async () => {
    if (!account) return

    const whole = !!wholeRef.current?.checked
    const args = { business: account.business, uid: account.uid }

    produce((draft) => {
      draft.busy = true
    })

    try {
      if (whole) {
        const count = await deleteGachaRecordsByBusinessAndUid(args)
        console.log(`Deleted ${count} gacha records for account ${account.uid}.`)
      }

      console.log(`Deleting account ${account.uid}...`)
      await deleteAccountMutation.mutateAsync(args)
    } catch (error) {
      // FIXME: Generally no errors
      produce((draft) => {
        draft.busy = false
      })
      throw error
    }

    produce((draft) => {
      draft.busy = false
      draft.open = false
    })

    console.log(`Deleting prettized gacha records for account ${account.uid}...`)
    removePrettizedGachaRecordsQuery(args.business, args.uid, i18n.constants.gacha)
    removeFirstGachaRecordQuery(args.business, args.uid)
  }, [account, deleteAccountMutation, i18n.constants.gacha, produce])

  if (!account || !state.open) {
    return null
  }

  return (
    <Dialog
      modalType="alert"
      open={state.open}
    >
      <DialogSurface className={styles.root}>
        <DialogBody>
          <Locale
            component={DialogTitle}
            mapping={[
              'Pages.Gacha.LegacyView.Toolbar.Account.DeleteAccountDialog.Title',
              { keyofBusinesses: ReversedBusinesses[account.business] },
            ]}
          />
          <DialogContent className={styles.content}>
            <Field
              label={<Locale mapping={['Pages.Gacha.LegacyView.Toolbar.Account.DeleteAccountDialog.Uid']} />}
              orientation="horizontal"
            >
              <Input
                appearance="filled-darker"
                value={String(account.uid)}
                readOnly
              />
            </Field>
            {account.properties?.displayName && (
              <Field
                label={<Locale mapping={['Pages.Gacha.LegacyView.Toolbar.Account.DeleteAccountDialog.DisplayName']} />}
                orientation="horizontal"
              >
                <Input
                  appearance="filled-darker"
                  value={account.properties.displayName}
                  readOnly
                />
              </Field>
            )}
            <Field
              label={<Locale mapping={['Pages.Gacha.LegacyView.Toolbar.Account.DeleteAccountDialog.Whole']} />}
              orientation="horizontal"
              validationState="error"
              validationMessage={<Locale
                mapping={['Pages.Gacha.LegacyView.Toolbar.Account.DeleteAccountDialog.WholeInformation']} />}
            >
              <Switch ref={wholeRef} />
            </Field>
          </DialogContent>
          <DialogActions>
            <Locale
              component={Button}
              appearance="secondary"
              disabled={state.busy}
              onClick={() => produce((draft) => {
                draft.open = false
              })}
              mapping={['Pages.Gacha.LegacyView.Toolbar.Account.DeleteAccountDialog.CancelBtn']}
            />
            <Locale
              component={Button}
              appearance="primary"
              disabled={state.timeoutCount > 0 || state.busy}
              onClick={handleSubmit}
              mapping={(i18n) => {
                if (state.timeoutCount > 0) {
                  return state.timeoutCount
                } else {
                  return i18n.t(['Pages.Gacha.LegacyView.Toolbar.Account.DeleteAccountDialog.SubmitBtn'])
                }
              }}
            />
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
})

const useAccountItemStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  avatar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '2.5rem',
    height: '2.5rem',
    '& img': {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    },
  },
  information: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    maxWidth: '5rem',
  },
})

interface AccountItemProps {
  keyofBusinesses: KeyofBusinesses
  account: Account | null
}

function AccountItem (props: AccountItemProps) {
  const styles = useAccountItemStyles()
  const { keyofBusinesses, account } = props

  const avatarId = account?.properties?.avatarId
  const avatarSrc = avatarId && BizImages[keyofBusinesses].Character![avatarId]

  return (
    <div className={styles.root}>
      <div className={styles.avatar}>
        <img src={avatarSrc || BizImages[keyofBusinesses].Material!.Icon!} />
      </div>
      <div className={styles.information}>
        <Locale
          component={Body1Strong}
          wrap={false}
          truncate
          mapping={account
            ? account?.properties?.displayName || [`Business.${ReversedBusinesses[account.business]}.Player.Name`]
            : ['Pages.Gacha.LegacyView.Toolbar.Account.NoAvailable']
          }
        />
        {account && <Caption1>{account.uid}</Caption1>}
      </div>
    </div>
  )
}
