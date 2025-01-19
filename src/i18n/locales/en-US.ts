export default {
  text: 'English (US)',
  language: 'en-US',
  matches: /^en/,
  translation: {
    Business: {
      GenshinImpact: {
        Name: 'Genshin Impact',
        Player: 'Traveler',
        Currency: 'Primogem',
        Gacha: {
          Name: 'Wish',
        },
        DataFolder: {
          Example: 'X:/Genshin Impact/Genshin Impact Game/GenshinImpact_Data',
        },
      },
      HonkaiStarRail: {
        Name: 'Honkai: Star Rail',
        Player: 'Trailblazer',
        Currency: 'Stellar Jade',
        Gacha: {
          Name: 'Wrap',
        },
        DataFolder: {
          Example: 'X:/Star Rail/Game/StarRail_Data',
        },
      },
      ZenlessZoneZero: {
        Name: 'Zenless Zone Zero',
        Player: 'Proxy',
        Currency: 'Polychrome',
        Gacha: {
          Name: 'Signal Search',
        },
        DataFolder: {
          Example: 'X:/ZenlessZoneZero Game/ZenlessZoneZero_Data',
        },
      },
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
            '/gacha/ZenlessZoneZero': '$t(Business.ZenlessZoneZero.Name)',
          },
        },
      },
    },
    Pages: {
      Gacha: {
        LegacyView: {
          GachaItem: {
            Limited: 'Limited',
          },
          UpsertAccountForm: {
            CancelBtn: 'Cancel',
            SubmitBtn: 'Confirm',
            Valid: 'It\'s valid.',
            SuccessAdded: 'Account successfully Added: {{uid}}',
            SuccessEdited: 'Account successfully Edited: {{uid}}',
            Uid: {
              Label: 'UID',
              Placeholder: 'UID for in-game account',
              Required: 'Please enter the UID field value.',
              Pattern: 'Please enter the correct UID format.',
              AlreadyExists: 'This account UID already exists.',
            },
            DisplayName: {
              Label: 'Display Name',
              Placeholder: 'Display name of the account (for identification only)',
              Length: 'Maximum character length limit exceeded.',
            },
            DataFolder: {
              Label: 'Data Folder',
              Placeholder: 'Full path to the game data folder. \nFor Example: "$t(Business.{{business}}.DataFolder.Example)"',
              Required: 'Please set the game data folder.',
              AutoFindBtn: 'Auto Find',
              ManualFindBtn: 'Manual Choice',
              ManualFindTitle: 'Please choice the game data directory Manually:',
              EmptyFind: 'A valid game data folder was not found. Please check that the game is installed and running.',
            },
          },
          UpsertAccountDialog: {
            AddTitle: 'Add new Account: $t(Business.{{business}}.Name)',
            EditTitle: 'Edit Account: $t(Business.{{business}}.Name)',
          },
        },
      },
      Settings: {
        Hero: {
          OfficialBtn: 'Official',
          FeedbackBtn: 'Feedback',
          LicenseNote: 'For personal study and communication use only. Please do not use it for any commercial or illegal purposes.',
        },
        Options: {
          Cloud: {
            Test: {
              Title: 'Cloud Storage',
              Subtitle: 'Synchronize data anytime and anywhere through cloud storage services to avoid data loss.',
            },
          },
          General: {
            Title: 'General',
            Language: {
              Title: 'Language',
              Subtitle: 'Change the primary language used by the application.',
            },
          },
          Appearance: {
            Title: 'Appearance',
            Namespace: {
              Title: 'Theme Color',
              Subtitle: 'Change the primary colors displayed in the application.',
            },
            ColorScheme: {
              Title: 'Preferred Color Scheme',
              Subtitle: 'Toggle the application to use light theme or dark theme.',
              Light: 'Light',
              Dark: 'Dark',
            },
            ScaleLevel: {
              Title: 'Interface Scaling',
              Subtitle: 'Change the scale level of the interface in the application.',
            },
          },
          About: {
            Title: 'About',
            Updater: {
              Title: 'Application Update',
              Subtitle: 'Check for application version updates.',
              CheckBtn: 'Check Update',
              Channel: {
                Stable: 'Stable (Release)',
                Insider: 'Insider (Alpha)',
              },
            },
            Specification: {
              Title: 'Device Specifications',
              CopyBtn: 'Copy',
              OperatingSystem: 'Operating system',
              SystemVersion: 'System version',
              SystemType: 'System type',
              Webview2: 'Webview2',
              Tauri: 'Tauri',
            },
          },
        },
      },
    },
  },
} as const
