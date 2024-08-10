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
    },
    Pages: {
      Settings: {
        Hero: {
          OfficialBtn: 'Official',
          FeedbackBtn: 'Feedback',
          LicenseNote: 'For personal study and communication use only. Please do not use it for any commercial or illegal purposes.'
        },
        Options: {
          Cloud: {
            Test: {
              Title: 'Cloud Storage',
              Subtitle: 'Synchronize data anytime and anywhere through cloud storage services to avoid data loss.'
            }
          },
          General: {
            Title: 'General',
            Language: {
              Title: 'Language',
              Subtitle: 'Change the primary language used by the application.',
              'en-US': 'English (US)',
              'zh-Hans': 'Chinese (Simplified)',
              'zh-Hant': 'Chinese (Traditional)'
            }
          },
          Appearance: {
            Title: 'Appearance',
            Namespace: {
              Title: 'Theme Color',
              Subtitle: 'Change the primary colors displayed in the application.'
            },
            ColorScheme: {
              Title: 'Preferred Color Scheme',
              Subtitle: 'Toggle the application to use light theme or dark theme.',
              Light: 'Light',
              Dark: 'Dark'
            },
            ScaleLevel: {
              Title: 'Interface Scaling',
              Subtitle: 'Change the scale level of the interface in the application.'
            }
          },
          About: {
            Title: 'About',
            Updater: {
              Title: 'Application Update',
              Subtitle: 'Check for application version updates.',
              CheckBtn: 'Check Update',
              Channel: {
                Stable: 'Stable (Release)',
                Insider: 'Insider (Alpha)'
              }
            },
            Specification: {
              Title: 'Device Specifications',
              CopyBtn: 'Copy',
              OperatingSystem: 'Operating system',
              SystemVersion: 'System version',
              SystemType: 'System type',
              Webview2: 'Webview2'
            }
          }
        }
      }
    }
  }
} as const
