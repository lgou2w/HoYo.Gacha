import { ColorScheme } from '@/interfaces/Theme'
import { declareCommand } from '.'

export type ChangeThemeArgs = { colorScheme: ColorScheme }
export const changeTheme = declareCommand<ChangeThemeArgs>('core_change_theme')
