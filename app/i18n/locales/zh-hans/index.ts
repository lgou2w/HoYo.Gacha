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
    gacha: 'zh-cn',
    dayjs: 'zh-cn',
    dayjsFormats: {
      GachaOverviewTagsGridRecentCalendar: {
        lastDay: '[昨天]',
        sameDay: '[今天]',
        nextDay: '[明天]',
        nextWeek: '[下周]dd',
        lastWeek: '[上周]dd',
        sameElse: 'YYYY/MM/DD',
      },
    },
  },
  Common,
  Error,
  GachaPage,
  RootPage,
  HomePage,
  SettingsPage,
} as const
