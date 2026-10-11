import { Menu, MenuButton, MenuList, MenuPopover, MenuTrigger, MenuTriggerChildProps, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { useAccount } from '@/routes/Gacha/contexts/Account/hooks'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import AccountItem from './AccountItem'
import AccountsAddGroup from './AccountsAddGroup'
import AccountsGroup from './AccountsGroup'
import { useAccountMenu } from './hooks'

export default function AccountMenuInner () {
  const { menu: { checkedValues, handleSelect } } = useAccountMenu()

  return (
    <Menu
      positioning={{ offset: { crossAxis: 0, mainAxis: 8 } }}
      checkedValues={checkedValues}
      onCheckedValueChange={handleSelect}
    >
      <MenuTrigger disableButtonEnhancement>
        {(props) => (
          <AccountMenuButton {...props} />
        )}
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <AccountsGroup />
          <AccountsAddGroup />
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}

const useButtonStyles = makeStyles({
  root: {
    display: 'inline-flex',
    minWidth: '10.625rem',
    height: 'inherit',
    margin: 0,
    padding: 0,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    '&[aria-expanded=true]': {
      color: tokens.colorBrandForeground2Hover,
      boxShadow: tokens.shadow2,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  menuIcon: {
    margin: `0 ${tokens.spacingHorizontalS} 0 auto`,
  },
})

function AccountMenuButton (props: MenuTriggerChildProps) {
  const styles = useButtonStyles()
  const business = useBusiness()
  const { selected } = useAccount()
  const { mutation } = useAccountMenu()

  return (
    <MenuButton
      className={styles.root}
      menuIcon={{ className: styles.menuIcon }}
      disabled={mutation.isPending}
      appearance="outline"
      size="large"
      {...props}
    >
      <AccountItem
        keyof={business.keyof}
        account={selected}
        withPadding
      />
    </MenuButton>
  )
}
