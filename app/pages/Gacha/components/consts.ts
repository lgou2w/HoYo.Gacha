import { Aggregated, PrettizedCategory } from '@/pages/Gacha/contexts/PrettizedRecords'

export const ToolbarHeight = '4rem'

export const PrettizedCategoryFlexOrderDataset = 'data-category' as const

// TODO: Custom order support will be available in the future.
export const PrettizedCategoryFlexOrders = {
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.Character}"]`]: { order: 'var(--order, 0)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.Weapon}"]`]: { order: 'var(--order, 1)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.CollaborationCharacter}"]`]: { order: 'var(--order, 2)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.CollaborationWeapon}"]`]: { order: 'var(--order, 3)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.Chronicled}"]`]: { order: 'var(--order, 4)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.Permanent}"]`]: { order: 'var(--order, 5)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.Bangboo}"]`]: { order: 'var(--order, 6)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.Beginner}"]`]: { order: 'var(--order, 7)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.PermanentOde}"]`]: { order: 'var(--order, 8)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.EventOde}"]`]: { order: 'var(--order, 9)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.ExclusiveRescreening}"]`]: { order: 'var(--order, 10)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${PrettizedCategory.WEngineReverberation}"]`]: { order: 'var(--order, 11)' },
  [`&[${PrettizedCategoryFlexOrderDataset}="${Aggregated}"]`]: { order: 'var(--order, 12)' },
  order: 999, // others can be placed last.
} as const
