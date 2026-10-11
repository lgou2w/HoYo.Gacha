import { ComponentProps } from 'react'
import { Body1, Caption1, Image, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { Account, KeyofAccountBusiness, KnownAccountProperties } from '@/api/Account'
import BusinessImages from '@/assets/Images/BusinessImages'
import { KnownI18nNs, useI18n } from '@/i18n'

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    flexDirection: 'row',
    height: 'inherit',
    columnGap: tokens.spacingHorizontalS,
  },
})

export interface AccountItemProps extends Omit<ComponentProps<'div'>, 'children'> {
  keyof: KeyofAccountBusiness
  account: Account | null
  withPadding?: boolean
}

export default function AccountItem (props: AccountItemProps) {
  const { keyof, account, withPadding, className, ...rest } = props
  const styles = useStyles()

  return (
    <div className={mergeClasses(styles.root, className)} {...rest}>
      <Avatar
        keyof={keyof}
        avatarId={account?.properties?.avatarId}
        withPadding={withPadding}
      />
      <Identity
        keyof={keyof}
        account={account}
      />
    </div>
  )
}

const useAvatarStyles = makeStyles({
  root: {
    display: 'flex',
    padding: 0,
  },
  withPadding: {
    padding: tokens.spacingVerticalXS,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: tokens.borderRadiusCircular,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
  },
})

interface AvatarProps {
  keyof: KeyofAccountBusiness
  avatarId?: KnownAccountProperties['avatarId']
  withPadding?: boolean
}

function Avatar (props: AvatarProps) {
  const { keyof, avatarId, withPadding } = props
  const styles = useAvatarStyles()

  return (
    <div className={mergeClasses(styles.root, withPadding && styles.withPadding)}>
      <Image
        className={styles.image}
        src={BusinessImages[keyof].Icon}
      />
    </div>
  )
}

const useIdentityStyles = makeStyles({
  root: {
    display: 'inline-flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  name: {
    maxWidth: '6rem',
  },
  uid: {
    fontFamily: tokens.fontFamilyMonospace,
  },
})

interface IdentityProps {
  keyof: KeyofAccountBusiness
  account: Account | null
}

function Identity (props: IdentityProps) {
  const { keyof, account } = props
  const styles = useIdentityStyles()
  const i18n = useI18n()

  const playerUid = account?.uid
  const playerName = account
    ? account?.properties?.displayName || i18n.t(`${keyof}.Player`)
    : i18n.t('Toolbar.AccountMenu.NoAvailable', { ns: KnownI18nNs.GachaPage })

  return (
    <div className={styles.root}>
      <Body1 className={styles.name} wrap={false} truncate>
        {playerName}
      </Body1>
      {playerUid && (
        <Caption1 className={styles.uid}>
          {playerUid}
        </Caption1>
      )}
    </div>
  )
}
