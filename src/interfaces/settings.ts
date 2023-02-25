export interface Account {
  uid: number
  displayName: string | null
  gameDataDir: string
  gachaUrl: string | null
}

export type Accounts = Record<number, Account>

export interface Settings {
  readonly accounts: Accounts
  readonly selectedAccount: Account | null
}

export interface SettingsFn {
  addAccount (account: Account): Promise<Accounts>
  removeAccount (uid: Account['uid']): Promise<[Accounts, Account]>
  updateAccount (uid: Account['uid'], updated: Omit<Account, 'uid'>): Promise<Accounts>
  selectAccount (uid: Account['uid']): Promise<Account | null>
}
