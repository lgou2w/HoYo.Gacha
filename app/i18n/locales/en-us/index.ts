import Common from './Common.json' with { type: 'json' }
import GachaPage from './GachaPage.json' with { type: 'json' }
import HomePage from './HomePage.json' with { type: 'json' }
import RootPage from './RootPage.json' with { type: 'json' }

export default {
  code: 'en-US',
  matches: /^en/,
  constants: {
    text: 'English (US)',
    dayjs: 'en',
    gacha: 'en-us',
  },
  Common,
  GachaPage,
  HomePage,
  RootPage,
} as const
