/* eslint-disable camelcase */

export default {
  language: 'en-US',
  matches: /^en/,
  constants: {
    text: 'English (US)',
    dayjs: 'en',
  },
  translation: {
    Business: {
      GenshinImpact: {
        Name: 'Genshin Impact',
        Player: {
          Name: 'Traveler',
          Girl: 'Lumine',
          Boy: 'Aether',
        },
        Currency: {
          Name01: 'Primogem',
          Name02: 'Genesis Crystal',
        },
        Gacha: {
          Name: 'Wish',
          Ticket01: 'Acquaint Fate',
          Ticket02: 'Intertwined Fate',
          Category: {
            Beginner: {
              Badge: 'Novice Wish',
              Title: 'Beginners\' Wish',
            },
            Permanent: {
              Badge: 'Standard Wish',
              Title: 'Wanderlust Invocation',
            },
            Character: 'Character Event Wish',
            Weapon: 'Weapon Event Wish',
            Chronicled: 'Chronicled Wish',
            Aggregated: 'Aggregated',
          },
        },
        DataFolder: {
          Example: 'X:/Genshin Impact/Genshin Impact Game/GenshinImpact_Data',
        },
      },
      HonkaiStarRail: {
        Name: 'Honkai: Star Rail',
        Player: {
          Name: 'Trailblazer',
          Girl: 'Stelle',
          Boy: 'Caelus',
        },
        Currency: {
          Name01: 'Stellar Jade',
          Name02: 'Oneiric Shard',
        },
        Gacha: {
          Name: 'Wrap',
          Ticket01: 'Star Rail Pass',
          Ticket02: 'Star Rail Special Pass',
          Category: {
            Beginner: {
              Badge: 'Starter Warp',
              Title: 'Departure Warp',
            },
            Permanent: {
              Badge: 'Regular Warp',
              Title: 'Stellar Warp',
            },
            Character: 'Character Event Wrap',
            Weapon: 'Light Cone Event Warp',
            Aggregated: 'Aggregated',
          },
        },
        DataFolder: {
          Example: 'X:/Star Rail/Game/StarRail_Data',
        },
      },
      ZenlessZoneZero: {
        Name: 'Zenless Zone Zero',
        Player: {
          Name: 'Proxy',
          Girl: 'Belle',
          Boy: 'Wise',
        },
        Currency: {
          Name01: 'Polychrome',
          Name02: 'Monochrome',
        },
        Gacha: {
          Name: 'Signal Search',
          Ticket01: 'Master Tape',
          Ticket02: 'Encrypted Master Tape',
          Ticket03: 'Boopon',
          Category: {
            Permanent: {
              Badge: 'Stable Channel',
              Title: 'Star-Studded Cast',
            },
            Character: 'Exclusive Channel',
            Weapon: 'W-Engine Channel',
            Bangboo: {
              Badge: 'Bangboo Channel',
              Title: 'An Outstanding Partner',
            },
            Aggregated: 'Aggregated',
          },
        },
        DataFolder: {
          Example: 'X:/ZenlessZoneZero Game/ZenlessZoneZero_Data',
        },
      },
    },
    Routes: {
      '/': 'Homepage',
      '/Settings': 'Settings',
      '/Gacha/GenshinImpact': '$t(Business.GenshinImpact.Name)',
      '/Gacha/HonkaiStarRail': '$t(Business.HonkaiStarRail.Name)',
      '/Gacha/ZenlessZoneZero': '$t(Business.ZenlessZoneZero.Name)',
    },
    Pages: {
      Gacha: {
        LegacyView: {
          GachaItem: {
            Limited: 'Limited',
          },
          Toolbar: {
            Account: {
              Title: 'Account',
              Available: 'Available',
              NoAvailable: 'No account',
              AddNewAccount: 'Add new account',
            },
            Url: {
              Title: '$t(Business.{{keyofBusinesses}}.Gacha.Name) URL',
              Deadline: '(Valid with {{deadline}})',
              Expired: '(Has expired)',
              Input: {
                Placeholder: '$t(Business.{{keyofBusinesses}}.Gacha.Name) URL',
              },
              CopyBtn: 'Copy',
              UpdateBtn: 'Update',
            },
            Tabs: {
              Title: 'Tabs',
              Overview: 'Overview',
              Analysis: 'Analysis',
              Chart: 'Chart',
            },
            Convert: {
              Import: {
                Title: 'Import',
              },
              Export: {
                Title: 'Export',
              },
            },
          },
          UpsertAccountForm: {
            CancelBtn: 'Cancel',
            SubmitBtn: 'Confirm',
            Valid: 'It\'s valid.',
            Uid: {
              Label: 'UID',
              Placeholder: 'UID for in-game account',
              Required: 'Please enter the UID field value.',
              Pattern: 'Please enter the correct UID format.',
              AlreadyExists: 'This account UID already exists.',
            },
            DisplayName: {
              Label: 'Display Name',
              Placeholder: 'Display name (Optional, for identification purposes only)',
              Length: 'Maximum character length limit exceeded.',
            },
            DataFolder: {
              Label: 'Data Folder',
              Placeholder: 'Full path to the game data folder. \nFor Example: "$t(Business.{{keyofBusinesses}}.DataFolder.Example)"',
              Required: 'Please set the game data folder.',
              AutoFindBtn: 'Auto Find',
              ManualFindBtn: 'Manual Choice',
              ManualFindTitle: 'Please choice the game data folder for $t(Business.{{keyofBusinesses}}.Name)',
              EmptyFind: 'A valid game data folder was not found. Please check that the game is installed and running.',
            },
          },
          UpsertAccountDialog: {
            AddTitle: 'Add new account: "$t(Business.{{keyofBusinesses}}.Name)"',
            AddSuccess: 'Successfully added new account: {{uid}}',
            EditTitle: 'Edit account: "$t(Business.{{keyofBusinesses}}.Name)"',
            EditSuccess: 'Successfully edited account: {{uid}}',
          },
          DataConvert: {
            Dialog: {
              ImportTitle: 'Import $t(Business.{{keyofBusinesses}}.Gacha.Name) Records',
              ExportTitle: 'Export $t(Business.{{keyofBusinesses}}.Gacha.Name) Records',
            },
            Format: {
              Uigf: {
                Text: 'UIGF',
                Info: 'Uniformed Interchangeable GachaLog Format standard (UIGF) v4.0',
              },
              LegacyUigf: {
                Text: 'UIGF (Legacy)',
                Info: 'Uniformed Interchangeable GachaLog Format standard (UIGF) v2.2, v2.3, v2.4, v3.0',
              },
              Srgf: {
                Text: 'SRGF',
                Info: 'Star Rail GachaLog Format standard (SRGF) v1.0',
              },
            },
            ImportForm: {
              File: {
                Label: 'File',
                Placeholder: 'Importing file',
                SelectBtn: 'Select...',
              },
              Format: {
                Label: 'Format',
              },
              SaveOnConflict: {
                Label: 'Save on conflict',
                Values: {
                  Nothing: 'Nothing',
                  Update: 'Update',
                },
              },
              CancelBtn: 'Cancel',
              SubmitBtn: 'Import',
            },
          },
          Clientarea: {
            Overview: {
              GridCard: {
                Labels: {
                  Total_zero: 'No pulls recorded yet',
                  Total_one: '{{count}} pull in total',
                  Total_other: '{{count, number}} pulls in total',
                  GoldenSum_zero: 'No gold pulled yet',
                  GoldenSum_other: 'Pulled {{count, number}} gold',
                  NextPity_zero: 'No pulls into pity yet',
                  NextPity_one: '{{count}} pull into pity',
                  NextPity_other: '{{count}} pulls into pity',
                  Beginner: 'Beginner: {{name}}',
                  Average: 'Average rate per gold: {{count}}',
                  Percentage: 'Gold rate: {{count}}%',
                  LimitedAverage: 'Average limited gold: {{count}}',
                  LimitedPercentage: 'Limited gold rate: {{count}}%',
                  LastGolden: 'Last gold: {{name}} ({{usedPity}})',
                  LastGoldenNone: 'Last gold: None',
                },
              },
              LastUpdated: {
                Title: 'Latest update date of $t(Business.{{keyofBusinesses}}.Gacha.Name) records: ',
              },
              Tooltips: {
                Fragment1: {
                  Token1: ' Total $t(Business.{{keyofBusinesses}}.Gacha.Name) ',
                  Token2: '{{total, number}}',
                  Token3: ' times, Total value: ',
                  Token4: '{{value, number}}',
                },
                Fragment2: ' $t(Business.{{keyofBusinesses}}.Gacha.Name) records date coverage: ',
                Fragment3: ' Due to official settings, the latest data is subject to a delay of approximately one hour. During peak periods for new pools, this delay may be extended. For precise timing, please refer to the in-game data.',
              },
            },
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
