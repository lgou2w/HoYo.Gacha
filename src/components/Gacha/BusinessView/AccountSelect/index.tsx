import React, { MouseEventHandler, useCallback } from 'react'
import { Menu, MenuButton, MenuItem, MenuList, MenuPopover, MenuTrigger, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { useAccountsQuery } from '@/api/queries/account'
import { useGachaSelectedAccountQuery, setGachaSelectedAccount } from '@/api/queries/gacha'
import useAccountBusiness from '@/components/AccountBusiness/useAccountBusiness'
import GachaBusinessViewAccountSelectItem from './Item'

const border = shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1)
const useStyle = makeStyles({
  trigger: {
    ...shorthands.padding(tokens.spacingHorizontalXXS, tokens.spacingHorizontalS),
    ...border,
    ':hover': { ...border },
    ':hover:active': { ...border }
  }
})

export default function GachaBusinessViewAccountSelect () {
  const { keyOfBusinesses, business } = useAccountBusiness()
  const { data: accounts } = useAccountsQuery()
  const { data: gachaAccountSelectedId } = useGachaSelectedAccountQuery(keyOfBusinesses)
  const classes = useStyle()

  const handleClickItem = useCallback<MouseEventHandler<HTMLDivElement>>((evt) => {
    evt.preventDefault()
    if (!evt.currentTarget.dataset.id) return
    const id = parseInt(evt.currentTarget.dataset.id)
    const account = accounts?.find((account) => account.id === id)
    if (account && account.id !== gachaAccountSelectedId) {
      console.debug('Update selected account: [%s]', keyOfBusinesses, account)
      setGachaSelectedAccount(keyOfBusinesses, account)
    }
  }, [keyOfBusinesses, accounts, gachaAccountSelectedId])

  if (!accounts) return null
  const accountsOfBusiness = accounts.filter((account) => account.business === business)

  let gachaAccountSelected = accountsOfBusiness.find((account) => account.id === gachaAccountSelectedId) || null
  if (!gachaAccountSelected && accountsOfBusiness.length > 0) {
    const first = accountsOfBusiness[0]
    console.warn('No account selected. Use first valid value: [%s]', keyOfBusinesses, first)
    setGachaSelectedAccount(keyOfBusinesses, first)
    gachaAccountSelected = first
  }

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          className={classes.trigger}
          appearance="subtle"
        >
          <GachaBusinessViewAccountSelectItem
            business={business}
            account={gachaAccountSelected}
          />
        </MenuButton>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {accountsOfBusiness.map((account) => (
            <MenuItem key={account.id} data-id={account.id} onClick={handleClickItem}>
              <GachaBusinessViewAccountSelectItem account={account} />
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
