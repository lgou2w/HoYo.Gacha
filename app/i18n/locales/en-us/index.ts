import Common from './Common.json'
import Error from './Error.json'
import GachaPage from './GachaPage.json'
import HomePage from './HomePage.json'
import RootPage from './RootPage.json'
import SettingsPage from './SettingsPage.json'

export default {
  code: 'en-US',
  matches: /^en/,
  constants: {
    text: 'English (US)',
    dayjs: 'en',
    gacha: 'en-us',
  },
  Common,
  Error,
  GachaPage,
  HomePage,
  RootPage,
  SettingsPage,
} as const
