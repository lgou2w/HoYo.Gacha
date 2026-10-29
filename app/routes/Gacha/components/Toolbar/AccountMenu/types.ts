import { ComponentType, RefObject, createContext } from 'react'
import { MenuListProps } from '@fluentui/react-components'
import { UpsertAccountDialogHandle } from '@/routes/Gacha/components/UpsertAccount/Dialog'
import { useSelectedAccountUidMutation } from '@/routes/Gacha/contexts/Account/hooks'

export const CheckedKey = 'selected-account'

export const DataAction = 'data-action'

export enum Action {
  Edit = 'Edit',
  ChooseAvatar = 'ChooseAvatar',
  Delete = 'Delete',
}

export type ActionMenuItem = {
  kind: 'action'
  icon: ComponentType<{ className?: string }>
  action: Action
} | {
  kind: 'divider'
}

export interface AccountMenuContextValue {
  /** Mutation for changing the selected account. */
  readonly mutation: {
    readonly change: ReturnType<typeof useSelectedAccountUidMutation>['mutate']
    readonly isPending: boolean
  }

  /** Menu checked state. */
  readonly menu: {
    readonly checkedValues: Record<typeof CheckedKey, string[]>
    readonly handleSelect: Required<MenuListProps>['onCheckedValueChange']
  }

  /** Imperative refs to dialogs. */
  readonly upsertDialogRef: RefObject<UpsertAccountDialogHandle | null>
}

export const AccountMenuContext = createContext<AccountMenuContextValue | null>(null)
AccountMenuContext.displayName = 'AccountMenuContext'
