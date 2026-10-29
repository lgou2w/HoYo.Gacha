import { MouseEventHandler, ReactElement, useCallback } from 'react'
import { Menu, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuItemRadio, MenuList, MenuPopover, MenuSplitGroup, MenuTrigger, makeStyles, menuItemClassNames, menuItemRadioClassNames, mergeClasses, tokens } from '@fluentui/react-components'
import { PersonCircleRegular, PersonDeleteRegular, PersonEditRegular } from '@fluentui/react-icons'
import { Account, AccountBusiness, KeyofAccountBusiness } from '@/api/Account'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useAccount } from '@/routes/Gacha/contexts/Account/hooks'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import AccountItem from './AccountItem'
import { useAccountMenu } from './hooks'
import { CheckedKey } from './types'

const I18nScope = 'Toolbar.AccountMenu'

export default function AccountsGroup () {
  const { accounts } = useAccount()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })

  if (!accounts.length) {
    return null
  }

  return (
    <>
      <MenuGroupHeader>
        {t(`${I18nScope}.Available`)}
      </MenuGroupHeader>
      <MenuGroup>
        {accounts.map((account) => (
          <AccountsGroupItem
            key={account.uid}
            accounts={accounts}
            account={account}
          />
        ))}
      </MenuGroup>
      <MenuDivider />
    </>
  )
}

const useItemStyles = makeStyles({
  radio: {
    alignItems: 'center',
    '&[aria-checked=true]': {
      color: tokens.colorBrandForeground1,
    },
    [`& .${menuItemRadioClassNames.content}`]: {
      height: '2rem',
    },
  },
  moreItem: {
    alignItems: 'center',
  },
})

interface AccountsGroupItemProps {
  accounts: Account[]
  account: Account
}

function AccountsGroupItem (props: AccountsGroupItemProps) {
  const { accounts, account } = props
  const styles = useItemStyles()

  return (
    <Menu openOnHover={false}>
      <MenuSplitGroup>
        <MenuItemRadio
          className={styles.radio}
          name={CheckedKey}
          value={String(account.uid)}
        >
          <AccountItem
            keyof={AccountBusiness[account.business] as KeyofAccountBusiness}
            account={account}
          />
        </MenuItemRadio>
        <MenuTrigger disableButtonEnhancement>
          <MenuItem
            className={styles.moreItem}
            aria-label="Accounts more"
          />
        </MenuTrigger>
      </MenuSplitGroup>
      <MenuPopover>
        <AccountsMoreMenu
          accounts={accounts}
          account={account}
        />
      </MenuPopover>
    </Menu>
  )
}

interface AccountsMoreMenuProps {
  accounts: Account[]
  account: Account
}

function AccountsMoreMenu (props: AccountsMoreMenuProps) {
  const { accounts, account } = props
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const { upsertDialogRef } = useAccountMenu()

  const handleClick = useCallback<MouseEventHandler>((evt) => {
    const operation = evt.currentTarget.getAttribute('data-operation') as MoreItemOperation | undefined
    const bindUid = evt.currentTarget.getAttribute('data-bind-uid')

    let bind: Account | undefined
    if (!operation
      || !bindUid
      || !(bind = accounts.find((el) => el.uid === +bindUid))) {
      return
    }

    console.debug('More item operation:', operation, bind)
    switch (operation) {
      case MoreItemOperation.Edit:
        upsertDialogRef.current?.open(bind)
    }
  }, [accounts, upsertDialogRef])

  return (
    <MenuList>
      <MenuGroupHeader>
        {t(`${I18nScope}.More.Label`)}
      </MenuGroupHeader>
      <MenuGroup>
        <AccountsMoreItem
          icon={<PersonEditRegular />}
          operation={MoreItemOperation.Edit}
          account={account}
          onClick={handleClick}
        />
        <AccountsMoreItem
          icon={<PersonCircleRegular />}
          operation={MoreItemOperation.ChooseAvatar}
          account={account}
          onClick={handleClick}
        />
        <MenuDivider />
        <AccountsMoreItem
          icon={<PersonDeleteRegular />}
          operation={MoreItemOperation.Delete}
          account={account}
          onClick={handleClick}
        />
      </MenuGroup>
    </MenuList>
  )
}

enum MoreItemOperation {
  Edit = 'Edit',
  ChooseAvatar = 'ChooseAvatar',
  Delete = 'Delete',
}

const useMoreItemStyles = makeStyles({
  delete: {
    color: tokens.colorStatusDangerForeground1,
    [`:hover, &:hover .${menuItemClassNames.icon}`]: {
      color: tokens.colorStatusDangerForeground1,
    },
  },
})

interface AccountsMoreItemProps {
  icon: ReactElement
  operation: MoreItemOperation
  account: Account
  onClick: MouseEventHandler
}

function AccountsMoreItem (props: AccountsMoreItemProps) {
  const { icon, operation, account, onClick } = props
  const styles = useMoreItemStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const business = useBusiness()

  // TODO: 'Genshin Impact: Miliastra Wonderland'
  //   does not currently support changing account avatar
  const disabled = business.toBe(AccountBusiness.MiliastraWonderland)
    && operation === MoreItemOperation.ChooseAvatar

  return (
    <MenuItem
      className={mergeClasses(operation === MoreItemOperation.Delete && styles.delete)}
      data-operation={operation}
      data-bind-business={account.business}
      data-bind-uid={account.uid}
      icon={icon}
      onClick={onClick}
      disabled={disabled}
    >
      {t(`${I18nScope}.More.${operation}`)}
    </MenuItem>
  )
}
