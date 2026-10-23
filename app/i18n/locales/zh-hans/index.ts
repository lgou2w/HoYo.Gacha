import Common from './Common.json' with { type: 'json' }
import Error from './Error.json' with { type: 'json' }
import GachaPage from './GachaPage.json' with { type: 'json' }
import HomePage from './HomePage.json' with { type: 'json' }
import RootPage from './RootPage.json' with { type: 'json' }

export default {
  code: 'zh-Hans',
  matches: ['zh-CN', 'zh-SG'],
  constants: {
    text: '简体中文',
    dayjs: 'zh-cn',
    gacha: 'zh-cn',
    calendarFormats: {
      'Clientarea.Overview.GridTags': {
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
  HomePage,
  RootPage,
} as const
