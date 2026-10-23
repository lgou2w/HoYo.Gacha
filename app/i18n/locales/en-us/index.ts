import Common from './Common.json' with { type: 'json' }
import Error from './Error.json' with { type: 'json' }
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
    calendarFormats: {
      'Clientarea.Overview.GridTags': {
        lastDay: '[Yesterday]',
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: '[Next] dddd',
        lastWeek: '[Last] dddd',
        sameElse: 'DD/MM/YYYY',
      },
    },
  },
  Common,
  Error,
  GachaPage,
  HomePage,
  RootPage,
} as const
