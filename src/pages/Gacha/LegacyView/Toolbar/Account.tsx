import React, { ElementRef, Fragment, MouseEventHandler, useCallback, useRef } from 'react'
import { Body1Strong, Caption2, Label, Menu, MenuButton, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuItemRadio, MenuList, MenuListProps, MenuPopover, MenuTrigger, makeStyles, menuButtonClassNames, menuItemClassNames, mergeClasses, tokens } from '@fluentui/react-components'
import { PersonAddRegular } from '@fluentui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { accountsQueryOptions, selectedAccountQueryOptions, useSetSelectedAccountMutation } from '@/api/queries/account'
import Locale from '@/components/UI/Locale'
import useBusiness from '@/hooks/useBusiness'
import type { Account } from '@/interfaces/Account'
import { Business, KeyofBusinesses, ReversedBusinesses } from '@/interfaces/Business'
import UpsertAccountDialog from '@/pages/Gacha/LegacyView/UpsertAccount/Dialog'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  content: {
    height: '2.5rem',
    minWidth: `calc(8.625rem + (${tokens.spacingHorizontalXS} * 2) + 4px)`,
  },
})

export default function GachaLegacyViewToolbarAccount () {
  const classes = useStyles()

  const { business, keyofBusinesses } = useBusiness()
  const { data: accounts = [] } = useQuery(accountsQueryOptions(keyofBusinesses))

  const addAccountDialogRef = useRef<ElementRef<typeof UpsertAccountDialog>>(null)
  const handleAddAccountClick = useCallback<MouseEventHandler>(() => {
    addAccountDialogRef.current?.setOpen(true)
  }, [])

  return (
    <div className={classes.root}>
      <Label size="small">Account</Label>
      <div className={classes.content}>
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
    justifyContent: 'flex-start',
    [`& .${menuButtonClassNames.menuIcon}`]: {
      marginLeft: 'auto',
    },
  },
  menuList: {
    [`& .${menuItemClassNames.root}`]: {
      gap: '0 !important',
    },
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
  const { business, keyofBusinesses, accounts, onAddAccountClick } = props
  const classes = useAccountListStyle()

  const { data: selectedAccount = null } = useQuery(selectedAccountQueryOptions(keyofBusinesses))

  const setSelectedAccount = useSetSelectedAccountMutation()
  const handleAccountSelect = useCallback<Required<MenuListProps>['onCheckedValueChange']>(async (_, data) => {
    if (data.name === 'account') {
      await setSelectedAccount.mutateAsync({
        business,
        data: accounts.find((el) => el.uid === +data.checkedItems[0]) ?? null,
      })
    }
  }, [accounts, business, setSelectedAccount])

  return (
    <Menu
      positioning={{ offset: { crossAxis: 0, mainAxis: 8 } }}
      checkedValues={{ account: selectedAccount ? [String(selectedAccount.uid)] : [] }}
      onCheckedValueChange={handleAccountSelect}
    >
      <MenuTrigger disableButtonEnhancement>
        <MenuButton className={classes.menuBtn} appearance="transparent">
          <AccountItem account={selectedAccount} />
        </MenuButton>
      </MenuTrigger>
      <MenuPopover>
        <MenuList className={classes.menuList}>
          <MenuGroupHeader>Available</MenuGroupHeader>
          {accounts.length > 0 && (
            <Fragment>
              <MenuGroup>
                {accounts.map((account) => (
                  <MenuItemRadio
                    key={account.uid}
                    name="account"
                    value={String(account.uid)}
                  >
                    <AccountItem account={account} size="small" />
                  </MenuItemRadio>
                ))}
              </MenuGroup>
              <MenuDivider />
            </Fragment>
          )}
          <MenuGroup>
            <MenuItem
              className={classes.addAccountBtn}
              onClick={onAddAccountClick}
              icon={<PersonAddRegular />}
            >
              Add New Account
            </MenuItem>
          </MenuGroup>
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}

const useAccountItemStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalSNudge,
    alignItems: 'center',
  },
  avatar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '2.5rem',
    height: '2.5rem',
    '&.small': {
      width: '2rem',
      height: '2rem',
    },
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
    '&.small': {
      maxWidth: '4rem',
    },
  },
})

interface AccountItemProps {
  account: Account | null
  size?: 'small' | 'default'
}

function AccountItem (props: AccountItemProps) {
  const { account, size } = props
  const classes = useAccountItemStyles()
  return (
    <div className={classes.root}>
      <div className={mergeClasses(classes.avatar, size)}>
        <span>HG</span>
      </div>
      <div className={mergeClasses(classes.information, size)}>
        <Locale
          component={Body1Strong}
          wrap={false}
          truncate
          mapping={account?.properties?.displayName ?? (account
            ? [`Business.${ReversedBusinesses[account.business]}.Player`]
            : 'No account')
          }
        />
        {account && <Caption2>{account.uid}</Caption2>}
      </div>
    </div>
  )
}
