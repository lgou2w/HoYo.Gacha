import { useQuery } from '@tanstack/react-query'
import invoke from '@/utilities/invoke'

// See: src-tauri/src/commands.rs
export interface CurrentVersion {
  readonly version: string
  readonly commit_hash: string
  readonly commit_tag: string | null
  readonly date: string
}

export interface LatestVersion {
  readonly id: number
  readonly tag_name: string
  readonly prerelease: boolean
  readonly created_at: string
  readonly asset: {
    readonly name: string
    readonly size: number
    readonly download_url: string
  }
}

export function useVersion () {
  return useQuery({
    queryKey: ['get_version'],
    queryFn: async () => invoke<CurrentVersion>('get_version'),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false
  })
}

export function useLatestVersion (mock?: () => LatestVersion) {
  if (import.meta.env.PROD && mock) throw new Error('Cannot mock in production')

  return useQuery({
    queryKey: ['get_latest_version'],
    queryFn: async () => mock ? mock() : invoke<LatestVersion>('get_latest_version'),
    refetchOnWindowFocus: false
  })
}
