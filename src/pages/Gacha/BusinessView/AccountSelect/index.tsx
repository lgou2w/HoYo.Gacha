import React, { MouseEventHandler, useCallback } from 'react'
import { Menu, MenuButton, MenuItem, MenuList, MenuPopover, MenuTrigger, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import useGachaStatefulAccount from '@/components/GachaStatefulAccountProvider/useStatefulAccount'
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
  const classes = useStyle()
  const {
    business,
    accountsOfBusiness,
    selectedAccount,
    setSelectedAccount
  } = useGachaStatefulAccount()

  const handleClickItem = useCallback<MouseEventHandler<HTMLDivElement>>((evt) => {
    evt.preventDefault()
    if (evt.currentTarget.dataset.id) {
      setSelectedAccount(+evt.currentTarget.dataset.id)
    }
  }, [setSelectedAccount])

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <MenuButton
          className={classes.trigger}
          disabled={!accountsOfBusiness.length}
          appearance="subtle"
        >
          <GachaBusinessViewAccountSelectItem
            business={business}
            account={selectedAccount}
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
