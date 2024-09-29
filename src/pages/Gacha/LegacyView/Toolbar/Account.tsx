import React from 'react'
import { Body1Strong, Caption2, Field, Menu, MenuButton, MenuItem, MenuList, MenuPopover, MenuTrigger, makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalSNudge,
    maxHeight: '2.5rem',
    padding: 0,
    margin: 0,
    border: 'none'
  },
  avatar: {
    '& span': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '50%',
      backgroundColor: tokens.colorNeutralBackground6
    }
  },
  information: {
    display: 'flex',
    flexDirection: 'column'
  }
})

export default function GachaLegacyViewToolbarAccount () {
  const classes = useStyles()
  return (
    <Field
      label={{
        size: 'small',
        children: 'Account'
      }}
    >
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton className={classes.root} appearance="transparent">
            <div className={classes.avatar}>
              <span>HG</span>
            </div>
            <div className={classes.information}>
              <Body1Strong>DisplayName</Body1Strong>
              <Caption2>UID</Caption2>
            </div>
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem>Account a</MenuItem>
            <MenuItem>Account b</MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
    </Field>
  )
}
