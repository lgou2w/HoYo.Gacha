import Common from './Common.json' with { type: 'json' }
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
  },
  Common,
  GachaPage,
  HomePage,
  RootPage,
} as const
