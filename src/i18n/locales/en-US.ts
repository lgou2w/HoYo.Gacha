export default {
  language: 'en-US',
  matches: /^en/,
  translation: {
    Business: {
      GenshinImpact: {
        Name: 'Genshin Impact'
      },
      HonkaiStarRail: {
        Name: 'Honkai: Star Rail'
      },
      ZenlessZoneZero: {
        Name: 'Zenless Zone Zero'
      }
    },
    Components: {
      UI: {
        Navbar: {
          TabList: {
            '/': 'Homepage',
            '/accounts': 'Accounts',
            '/settings': 'Settings',
            '/gacha/GenshinImpact': '$t(Business.GenshinImpact.Name)',
            '/gacha/HonkaiStarRail': '$t(Business.HonkaiStarRail.Name)',
            '/gacha/ZenlessZoneZero': '$t(Business.ZenlessZoneZero.Name)'
          }
        }
      }
    }
  }
} as const
