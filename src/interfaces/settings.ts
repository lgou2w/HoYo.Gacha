export interface Account {
  uid: number
  level: number
  avatarId?: number | null
  displayName?: string | null
  signature?: string | null
  nameCardId?: number | null
  gameDataDir: string
  gachaUrl?: string | null
  lastGachaUpdated?: string | null
}

export type Accounts = Record<number, Account>

export interface Settings {
  readonly accounts: Accounts
  readonly selectedAccount: Account | null
  readonly enkaNetwork?: boolean | null
}

export interface SettingsFn {
  addAccount (account: Account): Promise<Accounts>
  removeAccount (uid: Account['uid']): Promise<[Accounts, Account]>
  updateAccount (uid: Account['uid'], updated: Partial<Omit<Account, 'uid'>>): Promise<[Accounts, Account]>
  selectAccount (uid: Account['uid']): Promise<Account | null>
  toggleEnkaNetwork (): Promise<boolean>
}
