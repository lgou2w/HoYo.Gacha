import { ComponentPropsWithoutRef, ComponentRef, MouseEventHandler, PropsWithChildren, RefObject, createContext, use, useCallback, useRef } from 'react'
import { Menu, MenuButton, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuItemRadio, MenuList, MenuListProps, MenuPopover, MenuSplitGroup, MenuTrigger, MenuTriggerChildProps, makeStyles, menuItemClassNames, menuItemRadioClassNames, shorthands, tokens } from '@fluentui/react-components'
import { PeopleRegular, PersonAddRegular, PersonCircleRegular, PersonDeleteRegular, PersonEditRegular } from '@fluentui/react-icons'
import { Account } from '@/api/schemas/Account'
import { WithTrans, withTrans } from '@/i18n'
import DeleteAccountDialog from '@/pages/Gacha/components/DeleteAccount/Dialog'
import ToolbarContainer from '@/pages/Gacha/components/Toolbar/Container'
import UpsertAccountDialog from '@/pages/Gacha/components/UpsertAccount/Dialog'
import { BusinessState, useBusiness } from '@/pages/Gacha/contexts/Business'
import { useAccounts, useSelectedAccount, useSelectedAccountUidMutation } from '@/pages/Gacha/queries/accounts'
import AccountItem from './AccountItem'

export default withTrans.GachaPage(function Accounts ({ t }: WithTrans) {
  return (
    <UserMenuProvider>
      <ToolbarContainer
        icon={PeopleRegular}
        label={t('Toolbar.Accounts.Label')}
      >
        <UserMenu />
      </ToolbarContainer>
      <UpsertAccount />
      <DeleteAccount />
    </UserMenuProvider>
  )
})

// #region: State context

const UserMenuCheckedKey = 'selected-account'

const DatasetMoreItemUid = 'data-account-uid'
const DatasetMoreItemOperation = 'data-operation'

enum MoreItemOperation {
  Edit = 'Edit',
  ChooseAvatar = 'ChooseAvatar',
  Delete = 'Delete',
}

type UserMenuContextState = Readonly<{
  business: BusinessState
  accounts: Account[]
  selected: Account | null
  selectedUidMutation: ReturnType<typeof useSelectedAccountUidMutation>
  menu: {
    checkedValues: { [UserMenuCheckedKey]: string[] }
    handleSelect: Required<MenuListProps>['onCheckedValueChange']
  }
  moreItem: {
    activateRef: RefObject<Account | null>
    handleOperation: MouseEventHandler
  }
  upsertAccountDialogRef: RefObject<ComponentRef<typeof UpsertAccountDialog> | null>
  deleteAccountDialogRef: RefObject<ComponentRef<typeof DeleteAccountDialog> | null>
}>

const UserMenuContext = createContext<UserMenuContextState | null>(null)

function UserMenuProvider (props: PropsWithChildren) {
  const business = useBusiness()
  const accounts = useAccounts(business.keyof)

  const selected = useSelectedAccount(business.keyof)
  const selectedUidMutation = useSelectedAccountUidMutation()

  const moreItemActivateRef = useRef<Account | null>(null)
  const upsertAccountDialogRef = useRef<ComponentRef<typeof UpsertAccountDialog>>(null)
  const deleteAccountDialogRef = useRef<ComponentRef<typeof DeleteAccountDialog>>(null)

  const state: UserMenuContextState = {
    business,
    accounts,
    selected,
    selectedUidMutation,
    menu: {
      checkedValues: {
        [UserMenuCheckedKey]: selected
          ? [String(selected.uid)]
          : [],
      },
      handleSelect: useCallback((_, data) => {
        if (data.name !== UserMenuCheckedKey) {
          return
        }

        const checkedUid = +data.checkedItems[0]
        if (checkedUid === selected?.uid) {
          return
        }

        selectedUidMutation.mutate({
          business: business.value,
          data: checkedUid,
        })
      }, [business.value, selected?.uid, selectedUidMutation]),
    },
    moreItem: {
      activateRef: moreItemActivateRef,
      handleOperation: useCallback<MouseEventHandler>((evt) => {
        evt.preventDefault()
        const operation = evt.currentTarget.getAttribute(DatasetMoreItemOperation) as MoreItemOperation | null
        const bindUid = evt.currentTarget.getAttribute(DatasetMoreItemUid)

        let bind: Account | undefined
        if (!operation
          || !bindUid
          || !(bind = accounts.find((el) => el.uid === +bindUid))) {
          return
        }

        switch (operation) {
          case MoreItemOperation.Edit:
            upsertAccountDialogRef.current?.open(bind)
            break
          case MoreItemOperation.Delete:
            deleteAccountDialogRef.current?.open(bind)
            break
        }
      }, [accounts]),
    },
    upsertAccountDialogRef,
    deleteAccountDialogRef,
  }

  return (
    <UserMenuContext value={state}>
      {props.children}
    </UserMenuContext>
  )
}

function useUserMenu () {
  const state = use(UserMenuContext)
  if (!state) {
    throw new Error('useUserMenu must be used within a UserMenuProvider')
  } else {
    return state
  }
}

// #endregion

// #region: User menu

function UserMenu () {
  const { menu: { checkedValues, handleSelect } } = useUserMenu()

  return (
    <Menu
      positioning={{ offset: { crossAxis: 0, mainAxis: 8 } }}
      checkedValues={checkedValues}
      onCheckedValueChange={handleSelect}
    >
      <MenuTrigger disableButtonEnhancement>
        {(props) => (
          <UserMenuButton {...props} />
        )}
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <UserMenuGroupAccounts />
          <UserMenuGroupAdd />
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}

// #endregion

// #region: User menu button

const useUserMenuButtonStyles = makeStyles({
  root: {
    display: 'inline-flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 'inherit',
    margin: 0,
    padding: 0,
    minWidth: '10.625rem',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    '&[aria-expanded="true"]': {
      color: tokens.colorBrandForeground2Hover,
      boxShadow: tokens.shadow2,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  menuIcon: {
    margin: `0 ${tokens.spacingHorizontalS} 0 auto`,
  },
})

function UserMenuButton (props: MenuTriggerChildProps) {
  const styles = useUserMenuButtonStyles()
  const { business, selected, selectedUidMutation } = useUserMenu()

  return (
    <MenuButton
      className={styles.root}
      menuIcon={{ className: styles.menuIcon }}
      disabled={selectedUidMutation.isPending}
      appearance="outline"
      size="large"
      {...props}
    >
      <AccountItem
        business={business}
        account={selected}
      />
    </MenuButton>
  )
}

// #endregion

// #region: User menu group - Accounts

const UserMenuGroupAccounts = withTrans.GachaPage(function ({ t }: WithTrans) {
  const { accounts } = useUserMenu()

  // Empty
  if (!accounts.length) {
    return
  }

  return (
    <>
      <MenuGroupHeader>
        {t('Toolbar.Accounts.Available')}
      </MenuGroupHeader>
      <MenuGroup>
        {accounts.map((account) => (
          <UserMenuGroupAccountsItem
            key={account.uid}
            account={account}
          />
        ))}
      </MenuGroup>
      <MenuDivider />
    </>
  )
})

const useUserMenuGroupAccountsItemStyles = makeStyles({
  menuItem: {
    '&[aria-checked="true"]': {
      color: tokens.colorBrandForeground1,
    },
    [`& .${menuItemRadioClassNames.content}`]: {
      height: '2rem',
    },
  },
  moreItem: {
    [`&[data-operation="${MoreItemOperation.Delete}"]`]: {
      color: tokens.colorStatusDangerForeground1,
      [`:hover, &:hover .${menuItemClassNames.icon}`]: {
        color: tokens.colorStatusDangerForeground1,
      },
    },
  },
})

const UserMenuGroupAccountsItem = withTrans.GachaPage(function (
  { t, account }: WithTrans & { account: Account },
) {
  const styles = useUserMenuGroupAccountsItemStyles()
  const { business, moreItem } = useUserMenu()

  return (
    <Menu openOnHover={false}>
      <MenuSplitGroup>
        <MenuItemRadio
          className={styles.menuItem}
          name={UserMenuCheckedKey}
          value={String(account.uid)}
        >
          <AccountItem
            business={business}
            account={account}
            menuItem
          />
        </MenuItemRadio>
        <MenuTrigger disableButtonEnhancement>
          <MenuItem aria-label="Accounts more" />
        </MenuTrigger>
      </MenuSplitGroup>
      <MenuPopover>
        <MenuList>
          <MenuGroupHeader>
            {t('Toolbar.Accounts.More.Label')}
          </MenuGroupHeader>
          <MenuGroup>
            {[
              { icon: <PersonEditRegular />, operation: MoreItemOperation.Edit },
              { icon: <PersonCircleRegular />, operation: MoreItemOperation.ChooseAvatar },
              { divider: true },
              { icon: <PersonDeleteRegular />, operation: MoreItemOperation.Delete },
            ].map((item, index) => {
              if (typeof item.operation !== 'undefined') {
                return (
                  <UserMenuGroupAccountsMoreItem
                    className={styles.moreItem}
                    key={`${account.uid}-more-${item.operation}`}
                    icon={item.icon}
                    bind={account}
                    operation={item.operation}
                    onClick={moreItem.handleOperation}
                  >
                    {t(`Toolbar.Accounts.More.${item.operation}`)}
                  </UserMenuGroupAccountsMoreItem>
                )
              } else if (item.divider) {
                return <MenuDivider key={`${account.uid}-more-divider-${index}`} />
              }
            })}
          </MenuGroup>
        </MenuList>
      </MenuPopover>
    </Menu>
  )
})

function UserMenuGroupAccountsMoreItem (props: ComponentPropsWithoutRef<typeof MenuItem> & {
  bind: Account
  operation: MoreItemOperation
}) {
  const { bind, operation, ...rest } = props

  return (
    <MenuItem
      {...{
        [DatasetMoreItemUid]: String(bind.uid),
        [DatasetMoreItemOperation]: operation,
      }}
      {...rest}
    />
  )
}

// #endregion

// #region: User menu group - Add new account

const UserMenuGroupAdd = withTrans.GachaPage(function ({ t }: WithTrans) {
  const { upsertAccountDialogRef } = useUserMenu()
  return (
    <MenuGroup>
      <MenuItem
        icon={<PersonAddRegular />}
        onClick={() => upsertAccountDialogRef.current?.open(null)}
      >
        {t('Toolbar.Accounts.Add')}
      </MenuItem>
    </MenuGroup>
  )
})

// #endregion

// #region: Upsert & Delete account

function UpsertAccount () {
  const { business, accounts, upsertAccountDialogRef } = useUserMenu()
  return (
    <UpsertAccountDialog
      ref={upsertAccountDialogRef}
      business={business.value}
      accounts={accounts}
    />
  )
}

function DeleteAccount () {
  const { business, deleteAccountDialogRef } = useUserMenu()
  return (
    <DeleteAccountDialog
      ref={deleteAccountDialogRef}
      business={business.value}
    />
  )
}

// #endregion
