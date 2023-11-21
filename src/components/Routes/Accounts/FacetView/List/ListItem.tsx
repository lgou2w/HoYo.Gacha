import React from 'react'
import { Button, Divider, Text, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { MoreHorizontalRegular, ServerRegular } from '@fluentui/react-icons'
import { Account, AccountFacetsEntry, AccountServer, detectServer } from '@/api/interfaces/account'
import Locale from '@/components/Core/Locale'
import PlayerAvatar from '@/components/Facet/PlayerAvatar'

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
    minWidth: '4rem',
    maxWidth: '6rem'
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
  facetEntry: AccountFacetsEntry
  account: Account
}

export default function AccountsFacetViewListItem (props: Props) {
  const { facetEntry, account } = props
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
                t(`common.facet.${facetEntry.key}.player`)
            }}
          />
          <Text className="uid" as="p" font="numeric" size={200} weight="semibold">
            {account.uid}
          </Text>
        </div>
        <div className={classes.action}>
          <Button appearance="subtle" icon={<MoreHorizontalRegular />} />
        </div>
      </div>
      <Divider />
      <div className={classes.content}>
        <Text as="p" size={100}>
          <ServerRegular />
          <Locale
            component="span"
            mapping={[
              'components.routes.accounts.facetView.listItem.server',
              {
                facet: facetEntry.key,
                path: AccountServerLocaleKeyMappings[detectServer(account)]
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
