import React from 'react'
import { Button, Divider, Text, Tooltip, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { PeopleEditRegular, ServerRegular } from '@fluentui/react-icons'
import { Account, AccountServer, ReversedBusinesses, detectServer } from '@/api/interfaces/account'
import Locale from '@/components/Commons/Locale'
import AddOrEditDialog from '@/pages/Accounts/BusinessView/AddOrEditDialog'
import PlayerAvatar from '@/pages/Accounts/PlayerAvatar'

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalMNudge,
    boxShadow: tokens.shadow2,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS)
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingVerticalS
  },
  avatar: {
    display: 'inline-flex',
    maxWidth: '2.5rem',
    maxHeight: '2.5rem',
    '> img': {
      width: '100%',
      height: '100%'
    }
  },
  identifier: {
    display: 'inline-flex',
    flexDirection: 'column',
    width: '4.5rem'
  },
  action: {
    display: 'inline-flex',
    '> .fui-Button': {
      minWidth: '2rem',
      maxWidth: '2rem',
      ...shorthands.padding('0.3125rem'),
      '> .fui-Button__icon': {
        fontSize: tokens.fontSizeBase500,
        width: tokens.fontSizeBase500,
        height: tokens.fontSizeBase500
      }
    }
  },
  content: {
    display: 'inline-flex',
    flexDirection: 'column',
    '> *': {
      display: 'inline-flex',
      alignItems: 'center',
      columnGap: tokens.spacingVerticalSNudge
    },
    '> * svg': {
      width: 'auto',
      height: '100%'
    }
  }
})

interface Props {
  account: Account
}

export default function AccountsBusinessViewListItem (props: Props) {
  const classes = useStyles()
  const { account } = props

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.avatar}>
          <PlayerAvatar
            shape="circular"
            bordered
            business={account.business}
            type={[0, 'girl']}
          />
        </div>
        <div className={classes.identifier}>
          <Locale
            className="displayName"
            component={Text}
            as="p"
            font="base"
            size={300}
            wrap={false}
            truncate
            mapping={(t) => {
              return account.properties?.displayName as string ||
                t(`Business.${ReversedBusinesses[account.business]}.Player`)
            }}
          />
          <Text className="uid" as="p" font="numeric" size={200} weight="semibold">
            {account.uid}
          </Text>
        </div>
        <div className={classes.action}>
          <AddOrEditDialog
            edit={account}
            trigger={(
              <Tooltip
                relationship="label"
                positioning="after"
                content={<Locale mapping={['Pages.Accounts.BusinessView.ListItem.EditAccountBtn']} />}
                withArrow
              >
                <Button appearance="subtle" icon={<PeopleEditRegular />} />
              </Tooltip>
            )}
          />
        </div>
      </div>
      <Divider />
      <div className={classes.content}>
        <Text as="p" size={100}>
          <ServerRegular />
          <Locale
            component="span"
            mapping={[
              'Pages.Accounts.BusinessView.ListItem.Server',
              {
                business: ReversedBusinesses[account.business],
                path: AccountServer[detectServer(account.uid)]
              }
            ]}
          />
        </Text>
      </div>
    </div>
  )
}
