import { PeopleRegular } from '@fluentui/react-icons'
import { KnownI18nNs } from '@/i18n'
import ToolbarContainer from '@/routes/Gacha/components/Toolbar/Container'
import AccountMenuInner from './Menu'
import AccountMenuProvider from './provider'

export default function AccountMenu () {
  return (
    <AccountMenuProvider>
      <ToolbarContainer
        icon={PeopleRegular}
        label={{
          tKey: 'Toolbar.AccountMenu.Label',
          tNs: KnownI18nNs.GachaPage,
        }}
      >
        <AccountMenuInner />
      </ToolbarContainer>
    </AccountMenuProvider>
  )
}
