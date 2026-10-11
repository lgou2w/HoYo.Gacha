import { MenuGroup, MenuItem } from '@fluentui/react-components'
import { PersonAddRegular } from '@fluentui/react-icons'
import { KnownI18nNs, useI18n } from '@/i18n'

export default function AccountsAddGroup () {
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })

  return (
    <MenuGroup>
      <MenuItem
        icon={<PersonAddRegular />}
      >
        {t('Toolbar.AccountMenu.Add')}
      </MenuItem>
    </MenuGroup>
  )
}
