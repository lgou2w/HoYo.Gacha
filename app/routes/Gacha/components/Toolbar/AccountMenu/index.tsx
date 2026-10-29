import { PeopleRegular } from '@fluentui/react-icons'
import { KnownI18nNs } from '@/i18n'
import ToolbarContainer from '@/routes/Gacha/components/Toolbar/Container'
import UpsertAccountDialog from '@/routes/Gacha/components/UpsertAccount/Dialog'
import AccountMenuInner from './Menu'
import AccountMenuProvider from './Provider'
import { useAccountMenu } from './hooks'

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
      <UpsertAccount />
    </AccountMenuProvider>
  )
}

function UpsertAccount () {
  const { upsertDialogRef } = useAccountMenu()
  return <UpsertAccountDialog ref={upsertDialogRef} />
}
