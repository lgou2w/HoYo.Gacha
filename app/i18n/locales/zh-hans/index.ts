import Common from './Common.json'
import Error from './Error.json'
import GachaPage from './GachaPage.json'
import HomePage from './HomePage.json'
import RootPage from './RootPage.json'
import SettingsPage from './SettingsPage.json'

export default {
  code: 'zh-Hans',
  matches: ['zh-CN', 'zh-SG'],
  constants: {
    text: '简体中文',
    dayjs: 'zh-cn',
    gacha: 'zh-cn',
  },
  Common,
  Error,
  GachaPage,
  RootPage,
  HomePage,
  SettingsPage,
} as const
