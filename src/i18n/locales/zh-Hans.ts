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
    },
    Pages: {
      Settings: {
        Hero: {
          OfficialBtn: '官方网站',
          FeedbackBtn: '问题反馈',
          LicenseNote: '仅供个人学习交流使用。请勿用于任何商业或违法违规用途。'
        },
        Options: {
          Cloud: {
            Test: {
              Title: '云存储',
              Subtitle: '通过云存储服务，随时随地同步数据，避免数据丢失。'
            }
          },
          General: {
            Title: '常规',
            Language: {
              Title: '语言',
              Subtitle: '更改应用使用的主要语言。',
              'en-US': '英语 (US)',
              'zh-Hans': '简体中文',
              'zh-Hant': '繁体中文'
            }
          },
          Appearance: {
            Title: '外观',
            Namespace: {
              Title: '主题颜色',
              Subtitle: '更改应用中显示的主要颜色。'
            },
            ColorScheme: {
              Title: '偏好配色方案',
              Subtitle: '切换应用使用浅色主题或深色主题。',
              Light: '浅色',
              Dark: '深色'
            },
            ScaleLevel: {
              Title: '界面缩放',
              Subtitle: '更改应用中界面的缩放等级。'
            }
          },
          About: {
            Title: '关于',
            Updater: {
              Title: '应用更新',
              Subtitle: '检查应用的版本更新。',
              CheckBtn: '检查更新',
              Channel: {
                Stable: '稳定版 (Stable)',
                Insider: '预览版 (Insider)'
              }
            }
          }
        }
      }
    }
  }
} as const
