import Common from './Common.json' with { type: 'json' }
import GachaPage from './GachaPage.json' with { type: 'json' }
import HomePage from './HomePage.json' with { type: 'json' }
import RootPage from './RootPage.json' with { type: 'json' }

export default {
  code: 'zh-Hant',
  matches: ['zh-HK', 'zh-TW', 'zh-MO'],
  constants: {
    text: '繁體中文',
    dayjs: 'zh-tw',
    gacha: 'zh-tw',
  },
  Common,
  GachaPage,
  HomePage,
  RootPage,
} as const
