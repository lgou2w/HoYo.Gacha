import { ComponentPropsWithoutRef } from 'react'
import { Body1, Caption1, Image, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { Account } from '@/api/schemas/Account'
import BusinessImages from '@/assets/images/BusinessImages'
import { WithTransKnownNs, useI18n } from '@/i18n'
import GachaImage from '@/pages/Gacha/components/Image'
import { BusinessState } from '@/pages/Gacha/contexts/Business'
import { ItemCategory } from '@/pages/Gacha/contexts/PrettizedRecords'

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    height: 'inherit',
  },
  avatar: {
    display: 'flex',
    width: 'auto',
    height: 'inherit',
    aspectRatio: '1 / 1',
    padding: tokens.spacingVerticalXXS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWithMenuItem: {
    padding: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: tokens.borderRadiusCircular,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
  },
  identity: {
    display: 'inline-flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  identityName: {
    maxWidth: '6rem',
  },
  identityUid: {
    fontFamily: tokens.fontFamilyMonospace,
  },
})

interface AccountItemProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  business: BusinessState
  account: Account | null
  menuItem?: boolean
}

export default function AccountItem (props: AccountItemProps) {
  const { account, business, menuItem, className, ...rest } = props
  const styles = useStyles()
  const i18n = useI18n()

  const avatarId = account?.properties?.avatarId
  const playerUid = account?.uid
  const playerName = account
    ? account.properties?.displayName || i18n.t(`${business.keyof}.Player.Name`)
    : i18n.t('Toolbar.Accounts.NoAvailable', { ns: WithTransKnownNs.GachaPage })

  return (
    <div className={mergeClasses(styles.root, className)} {...rest}>
      <div className={mergeClasses(styles.avatar, menuItem && styles.avatarWithMenuItem)}>
        {avatarId
          ? (
              <GachaImage
                className={styles.avatarImage}
                keyof={business.keyof}
                itemId={Number(avatarId)}
                itemCategory={ItemCategory.Character}
              />
            )
          : (
              <Image
                className={styles.avatarImage}
                src={BusinessImages[business.keyof].Material?.Icon}
              />
            )}
      </div>
      <div className={styles.identity}>
        <Body1 className={styles.identityName} wrap={false} truncate>
          {playerName}
        </Body1>
        {playerUid && (
          <Caption1 className={styles.identityUid}>
            {playerUid}
          </Caption1>
        )}
      </div>
    </div>
  )
}
