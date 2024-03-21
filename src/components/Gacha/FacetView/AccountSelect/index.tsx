import React, { MouseEventHandler, useCallback } from 'react'
import { Menu, MenuButton, MenuItem, MenuList, MenuPopover, MenuTrigger, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { useAccountsQuery } from '@/api/queries/account'
import { useGachaSelectedAccountQuery, setGachaSelectedAccount } from '@/api/queries/gacha'
import useAccountFacet from '@/components/AccountFacet/useAccountFacet'
import GachaFacetViewAccountSelectItem from './Item'

const border = shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1)
const useStyle = makeStyles({
  trigger: {
    ...shorthands.padding(tokens.spacingHorizontalXXS, tokens.spacingHorizontalS),
    ...border,
    ':hover': { ...border },
    ':hover:active': { ...border }
  }
})

export default function GachaFacetViewAccountSelect () {
  const { keyOfFacets, facet } = useAccountFacet()
  const { data: accounts } = useAccountsQuery()
  const { data: gachaAccountSelectedId } = useGachaSelectedAccountQuery(keyOfFacets)
  const classes = useStyle()

  const handleClickItem = useCallback<MouseEventHandler<HTMLDivElement>>((evt) => {
    evt.preventDefault()
    if (!evt.currentTarget.dataset.id) return
    const id = parseInt(evt.currentTarget.dataset.id)
    const account = accounts?.find((account) => account.id === id)
    if (account && account.id !== gachaAccountSelectedId) {
      console.debug('Update selected account: [%s]', keyOfFacets, account)
      setGachaSelectedAccount(keyOfFacets, account)
    }
  }, [keyOfFacets, accounts, gachaAccountSelectedId])

  if (!accounts) return null
  const accountsOfFacet = accounts.filter((account) => account.facet === facet)

  let gachaAccountSelected = accountsOfFacet.find((account) => account.id === gachaAccountSelectedId) || null
  if (!gachaAccountSelected && accountsOfFacet.length > 0) {
    const first = accountsOfFacet[0]
    console.warn('No account selected. Use first valid value: [%s]', keyOfFacets, first)
    setGachaSelectedAccount(keyOfFacets, first)
    gachaAccountSelected = first
  }

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          className={classes.trigger}
          appearance="subtle"
        >
          <GachaFacetViewAccountSelectItem
            facet={facet}
            account={gachaAccountSelected}
          />
        </MenuButton>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {accountsOfFacet.map((account) => (
            <MenuItem key={account.id} data-id={account.id} onClick={handleClickItem}>
              <GachaFacetViewAccountSelectItem account={account} />
            </MenuItem>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
