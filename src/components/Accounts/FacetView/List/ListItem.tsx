import React from 'react'
import { Button, Divider, Text, Tooltip, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { PeopleEditRegular, ServerRegular } from '@fluentui/react-icons'
import { Account, AccountServer, ReversedAccountFacets, detectServer } from '@/api/interfaces/account'
import AddOrEditDialog from '@/components/Accounts/FacetView/AddOrEditDialog'
import PlayerAvatar from '@/components/Accounts/PlayerAvatar'
import Locale from '@/components/Core/Locale'

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalMNudge,
    boxShadow: tokens.shadow2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
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
        fontSize: '1.25rem',
        width: '1.25rem',
        height: '1.25rem'
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

export default function AccountsFacetViewListItem (props: Props) {
  const { account } = props
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <div className={classes.avatar}>
          <PlayerAvatar
            shape="circular"
            bordered
            facet={account.facet}
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
                t(`common.facet.${ReversedAccountFacets[account.facet]}.player`)
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
                content={<Locale mapping={['components.accounts.facetView.listItem.editAccountBtn']} />}
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
              'components.accounts.facetView.listItem.server',
              {
                facet: ReversedAccountFacets[account.facet],
                path: AccountServerLocaleKeyMappings[detectServer(account.uid)]
              }
            ]}
          />
        </Text>
      </div>
    </div>
  )
}

const AccountServerLocaleKeyMappings: Record<AccountServer, string> = {
  [AccountServer.Official]: 'official',
  [AccountServer.Channel]: 'channel',
  [AccountServer.USA]: 'oversea.usa',
  [AccountServer.Euro]: 'oversea.euro',
  [AccountServer.Asia]: 'oversea.asia',
  [AccountServer.Cht]: 'oversea.cht'
}
