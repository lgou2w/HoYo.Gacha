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
    gacha: 'zh-tw',
    dayjs: 'zh-tw',
    dayjsFormats: {
      GachaOverviewTagsGridRecentCalendar: {
        lastDay: '[昨天]',
        sameDay: '[今天]',
        nextDay: '[明天]',
        nextWeek: '[下週]dd',
        lastWeek: '[上週]dd',
        sameElse: 'YYYY/MM/DD',
      },
    },
  },
  Common,
  Error,
  GachaPage,
  HomePage,
  RootPage,
  SettingsPage,
} as const
