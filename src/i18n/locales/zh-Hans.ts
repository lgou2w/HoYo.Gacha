export default {
  language: 'zh-Hans',
  matches: ['zh-CN', 'zh-SG'],
  translation: {
    Business: {
      GenshinImpact: {
        Name: '原神'
      },
      HonkaiStarRail: {
        Name: '崩坏：星穹铁道'
      },
      ZenlessZoneZero: {
        Name: '绝区零'
      }
    },
    Components: {
      UI: {
        Navbar: {
          TabList: {
            '/': '主页',
            '/accounts': '账号',
            '/settings': '设置',
            '/gacha/GenshinImpact': '$t(Business.GenshinImpact.Name)',
            '/gacha/HonkaiStarRail': '$t(Business.HonkaiStarRail.Name)',
            '/gacha/ZenlessZoneZero': '$t(Business.ZenlessZoneZero.Name)'
          }
        }
      }
    }
  }
} as const
