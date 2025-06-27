import React, { ElementRef, Fragment, MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { Body1Strong, Button, Caption1, Menu, MenuButton, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuItemRadio, MenuList, MenuListProps, MenuPopover, MenuTrigger, Tooltip, makeStyles, menuItemClassNames, tokens } from '@fluentui/react-components'
import { PeopleListRegular, PersonAddRegular, PersonEditRegular } from '@fluentui/react-icons'
import { useAccountsSuspenseQueryData, useSelectedAccountSuspenseQueryData, useUpdateSelectedAccountUidMutation } from '@/api/queries/accounts'
import BizImages from '@/components/BizImages'
import Locale from '@/components/Locale'
import useBusinessContext from '@/hooks/useBusinessContext'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import type { Account } from '@/interfaces/Account'
import { Business, KeyofBusinesses, ReversedBusinesses } from '@/interfaces/Business'
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
    minWidth: `calc(8.625rem + (${tokens.spacingHorizontalXS} * 2) + 4px)`,
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
  editAccountBtn: {
    marginLeft: 'auto',
  },
  addAccountBtn: {
    fontSize: tokens.fontSizeBase200,
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
  const [open, setOpen] = useState(false)

  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const updateSelectedAccountUidMutation = useUpdateSelectedAccountUidMutation()
  const handleAccountSelect = useCallback<Required<MenuListProps>['onCheckedValueChange']>(async (_, data) => {
    if (data.name === 'account') {
      await updateSelectedAccountUidMutation.mutateAsync({
        business,
        data: accounts.find((el) => el.uid === +data.checkedItems[0])?.uid ?? null,
      })
    }
  }, [accounts, business, updateSelectedAccountUidMutation])

  // HACK: Dismiss all toasts when the selected account changes
  const notifier = useNotifier()
  const selectedAccountUidRef = useRef(selectedAccount?.uid)
  useEffect(() => {
    if (selectedAccountUidRef.current !== selectedAccount?.uid) {
      notifier.dismissAll()
    }

    selectedAccountUidRef.current = selectedAccount?.uid
  }, [notifier, selectedAccount?.uid])

  const i18n = useI18n()
  const editAccountDialogRef = useRef<ElementRef<typeof UpsertAccountDialog>>(null)
  const handleEditAccountClick = useCallback<MouseEventHandler>(() => {
    setOpen(false)
    editAccountDialogRef.current?.setOpen(true)
  }, [])

  return (
    <>
      <Menu
        open={open}
        onOpenChange={(_, data) => setOpen(data.open)}
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
                <MenuGroupHeader>
                  <Locale mapping={['Pages.Gacha.LegacyView.Toolbar.Account.Available']} />
                  <Tooltip
                    content={i18n.t('Pages.Gacha.LegacyView.Toolbar.Account.EditAccount')}
                    relationship="label"
                    positioning="before"
                    withArrow
                  >
                    <Button
                      className={styles.editAccountBtn}
                      onClick={handleEditAccountClick}
                      icon={<PersonEditRegular />}
                      appearance="subtle"
                      size="small"
                    />
                  </Tooltip>
                </MenuGroupHeader>
                <MenuGroup>
                  {accounts.map((account) => (
                    <MenuItemRadio
                      key={account.uid}
                      name="account"
                      value={String(account.uid)}
                    >
                      <AccountItem
                        keyofBusinesses={keyofBusinesses}
                        account={account}
                      />
                    </MenuItemRadio>
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
        edit={selectedAccount}
      />
    </>
  )
}

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

  // TODO: Custom avatar
  const avatarSrc = BizImages[keyofBusinesses].Material!.Icon!

  return (
    <div className={styles.root}>
      <div className={styles.avatar}>
        <img src={avatarSrc} />
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
