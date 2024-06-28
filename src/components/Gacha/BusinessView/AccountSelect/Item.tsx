import React from 'react'
import { Text, makeStyles, tokens } from '@fluentui/react-components'
import { Account, Business, ReversedBusinesses } from '@/api/interfaces/account'
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
  business: Business
  account: null
} | {
  account: Account
}

export default function GachaBusinessViewAccountSelectItem (props: Props) {
  const { account } = props
  const business = !account ? props.business : account.business

  const classes = useStyle()
  return (
    <div className={classes.root}>
      <div className={classes.avatar}>
        <PlayerAvatar
          shape="circular"
          bordered
          business={business}
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
              t(`business.${ReversedBusinesses[business]}.player`)
          }}
        />
        <Text className="uid" as="p" font="numeric" size={200} weight="semibold">
          {account?.uid || 'NULL'}
        </Text>
      </div>
    </div>
  )
}
