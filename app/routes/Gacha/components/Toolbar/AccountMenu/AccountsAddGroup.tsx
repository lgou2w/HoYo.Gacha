import { MouseEventHandler, useCallback } from 'react'
import { MenuGroup, MenuItem } from '@fluentui/react-components'
import { PersonAddRegular } from '@fluentui/react-icons'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useAccountMenu } from './hooks'

export default function AccountsAddGroup () {
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const { upsertDialogRef } = useAccountMenu()
  const handleClick = useCallback<MouseEventHandler>(() => {
    upsertDialogRef.current?.open(null)
  }, [upsertDialogRef])

  return (
    <MenuGroup>
      <MenuItem
        icon={<PersonAddRegular />}
        onClick={handleClick}
      >
        {t('Toolbar.AccountMenu.Add')}
      </MenuItem>
    </MenuGroup>
  )
}
