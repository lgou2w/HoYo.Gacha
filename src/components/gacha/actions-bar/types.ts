export const Actions = {
  UrlChange: 'url-change' as const,
  UrlCopy: 'url-copy' as const,
  GachaFetch: 'gacha-fetch' as const,
  GachaImport: 'gacha-import' as const,
  GachaExport: 'gacha-export' as const
}

export interface GachaActionsCallback {
  onAction: (
    error: Error | string | unknown | undefined | null,
    action?: typeof Actions[keyof typeof Actions],
    message?: string
  ) => void
}
