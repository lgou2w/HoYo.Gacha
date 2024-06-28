import React, { Fragment } from 'react'
import { Text, makeStyles, tokens, shorthands } from '@fluentui/react-components'
import { QuestionRegular } from '@fluentui/react-icons'
import { Account, Business, ReversedBusinesses } from '@/api/interfaces/account'
import Locale from '@/components/Commons/Locale'
import PlayerAvatar from '@/pages/Accounts/PlayerAvatar'

const useStyle = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingVerticalS,
    minHeight: '2.5rem'
  },
  avatar: {
    display: 'inline-flex',
    maxWidth: '2rem',
    maxHeight: '2rem',
    borderRadius: tokens.borderRadiusCircular,
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    '> img, svg': {
      width: '100%',
      height: '100%'
    },
    '> svg': {
      fontSize: tokens.fontSizeHero800
    }
  },
  identifier: {
    display: 'inline-flex',
    flexDirection: 'column',
    minWidth: '4.5rem',
    maxWidth: '5rem'
  }
})

type Props = {
  business: Business
  account: null
} | {
  account: Account
}

export default function GachaBusinessViewAccountSelectItem (props: Props) {
  const classes = useStyle()
  const { account } = props
  const business = !account ? props.business : account.business

  return (
    <div className={classes.root}>
      <div className={classes.avatar}>
        {account
          ? <PlayerAvatar
              business={business}
              gender="Girl"
              set={1}
              shape="circular"
            />
          : <QuestionRegular />
        }
      </div>
      <div className={classes.identifier}>
        {account
          ? <Fragment>
              <Locale
                className="displayName"
                component={Text}
                as="p"
                font="base"
                size={300}
                wrap={false}
                truncate
                mapping={(t) => {
                  return account.properties?.displayName ||
                    t(`Business.${ReversedBusinesses[business]}.Player`)
                }}
              />
              <Text className="uid" as="p" font="numeric" size={200} weight="semibold">
                {account.uid}
              </Text>
            </Fragment>
          : <Locale
              component={Text}
              as="p"
              font="base"
              size={300}
              wrap={false}
              truncate
              mapping={['Pages.Gacha.BusinessView.AccountSelect.Empty']}
            />
        }
      </div>
    </div>
  )
}
