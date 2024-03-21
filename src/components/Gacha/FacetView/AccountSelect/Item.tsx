import React from 'react'
import { Text, makeStyles, tokens } from '@fluentui/react-components'
import { Account, AccountFacet, ReversedAccountFacets } from '@/api/interfaces/account'
import PlayerAvatar from '@/components/Accounts/PlayerAvatar'
import Locale from '@/components/Core/Locale'

const useStyle = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingVerticalS
  },
  avatar: {
    display: 'inline-flex',
    maxWidth: '2rem',
    maxHeight: '2rem',
    '> img': {
      width: '100%',
      height: '100%'
    }
  },
  identifier: {
    display: 'inline-flex',
    flexDirection: 'column',
    width: '4.5rem'
  }
})

type Props = {
  facet: AccountFacet
  account: null
} | {
  account: Account
}

export default function GachaFacetViewAccountSelectItem (props: Props) {
  const { account } = props
  const facet = !account ? props.facet : account.facet

  const classes = useStyle()
  return (
    <div className={classes.root}>
      <div className={classes.avatar}>
        <PlayerAvatar
          shape="circular"
          bordered
          facet={facet}
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
            return account?.properties?.displayName as string ||
              t(`common.facet.${ReversedAccountFacets[facet]}.player`)
          }}
        />
        <Text className="uid" as="p" font="numeric" size={200} weight="semibold">
          {account?.uid || 'NULL'}
        </Text>
      </div>
    </div>
  )
}
