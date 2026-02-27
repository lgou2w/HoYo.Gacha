import Common from './Common.json'
import Error from './Error.json'
import GachaPage from './GachaPage.json'
import HomePage from './HomePage.json'
import RootPage from './RootPage.json'
import SettingsPage from './SettingsPage.json'

export default {
  code: 'zh-Hant',
  matches: ['zh-HK', 'zh-TW', 'zh-MO'],
  constants: {
    text: '繁體中文',
    dayjs: 'zh-tw',
    gacha: 'zh-tw',
  },
  Common,
  Error,
  GachaPage,
  HomePage,
  RootPage,
  SettingsPage,
} as const
