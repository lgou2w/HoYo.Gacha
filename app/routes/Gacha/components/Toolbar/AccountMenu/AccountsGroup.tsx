import { Menu, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuItemRadio, MenuPopover, MenuSplitGroup, MenuTrigger, makeStyles, menuItemRadioClassNames, tokens } from '@fluentui/react-components'
import { Account, AccountBusiness, KeyofAccountBusiness } from '@/api/Account'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useAccount } from '@/routes/Gacha/contexts/Account/hooks'
import AccountItem from './AccountItem'
import { CheckedKey } from './types'

export default function AccountsGroup () {
  const { accounts } = useAccount()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })

  if (!accounts.length) {
    return null
  }

  return (
    <>
      <MenuGroupHeader>
        {t('Toolbar.AccountMenu.Available')}
      </MenuGroupHeader>
      <MenuGroup>
        {accounts.map((account) => (
          <AccountsGroupItem
            key={account.uid}
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
  account: Account
}

function AccountsGroupItem (props: AccountsGroupItemProps) {
  const { account } = props
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

      </MenuPopover>
    </Menu>
  )
}
