/* eslint-disable camelcase */

export default {
  language: 'en-US',
  matches: /^en/,
  constants: {
    text: 'English (US)',
    dayjs: 'en',
    gacha: 'en-us',
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
            Beginner: 'Novice Wish',
            Beginner_Title: 'Beginners\' Wish',
            Permanent: 'Standard Wish',
            Permanent_Title: 'Wanderlust Invocation',
            Character: 'Character Event Wish',
            Weapon: 'Weapon Event Wish',
            Weapon_Title: 'Epitome Invocation',
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
            Beginner: 'Starter Warp',
            Beginner_Title: 'Departure Warp',
            Permanent: 'Regular Warp',
            Permanent_Title: 'Stellar Warp',
            Character: 'Character Event Wrap',
            Weapon: 'Light Cone Event Warp',
            CollaborationCharacter: 'Character Collaboration Warp',
            CollaborationWeapon: 'Light Cone Collaboration Warp',
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
            Permanent: 'Stable Channel',
            Permanent_Title: 'Star-Studded Cast',
            Character: 'Exclusive Channel',
            Weapon: 'W-Engine Channel',
            Bangboo: 'Bangboo Channel',
            Bangboo_Title: 'An Outstanding Partner',
            Aggregated: 'Aggregated',
            Aggregated_NoBangboo: '(Excluding Bangboo Channel)',
          },
        },
        DataFolder: {
          Example: 'X:/ZenlessZoneZero Game/ZenlessZoneZero_Data',
        },
      },
    },
    Errors: {
      Unexpected: 'An unexpected error occurred: {{message}}',
      SqlxError: 'An sqlx error occurred: {{message}}',
      SqlxDatabaseError: 'An sqlx database error occurred: {{message}}',
      DataFolderError: {
        Invalid: 'Invalid game data folder.',
        UnityLogFileNotFound: 'Unity log file not found: {{path}}',
        OpenUnityLogFile: 'Error opening Unity log file: {{cause.message}}: {{path}}',
        Vacant: 'Game data folder is vacant.',
      },
      GachaUrlError: {
        WebCachesNotFound: 'Webcaches path does not exist: {{path}}',
        OpenWebCaches: 'Error opening webcaches: {{cause.message}}: {{path}}',
        ReadDiskCache: 'Error reading disk cache: {{cause.message}}: {{path}}',
        EmptyData: 'Gacha url with empty data. The latest data will be delayed, please try again later!',
        NotFound: 'No valid gacha url found. Please try opening the history interface in the game!',
        Illegal: 'Illegal gacha url: {{url}}',
        IllegalGameBiz: 'Illegal gacha url GameBiz param: {{value}}',
        InvalidParams: 'Invalid gacha url parameters: {{params}}',
        Reqwest: 'Error when requesting gacha url: {{cause}}',
        AuthkeyTimeout: 'The gacha url has expired. Please reopen the history interface in the game!',
        VisitTooFrequently: 'The gacha url was visit too frequently, please try again later!',
        UnexpectedResponse: 'The gacha url returned an unexpected response: {{message}} (retcode: {{retcode}})',
        MissingMetadataEntry: 'Missing metadata entry: {{business}}, locale: {{locale}}, name: {{name}}',
        InconsistentUid: 'Owner uid of the gacha url does not match: {{actuals}} (expected: {{expected}})',
      },
      LegacyUigfGachaRecordsWriteError: {
        InvalidUid: 'Invalid business uid: {{uid}}',
        IncompatibleRecordBusiness: 'Incompatible record business: {{business}}, id: {{id}}, name: {{name}}, cursor: {{cursor}}',
        IncompatibleRecordOwner: 'Incompatible record owner uid: expected: {{expected}}, actual: {{actual}}, cursor: {{cursor}}',
        IncompatibleRecordLocale: 'Incompatible record locale: expected: {{expected}}, actual: {{actual}}, cursor: {{cursor}}',
        FailedMappingGachaType: 'Failed to mapping uigf gacha type: {{value}}, cursor: {{cursor}}',
        CreateOutput: 'Failed to create output: {{cause.message}}: {{path}}',
        Serialize: 'Serialization json error: {{cause}}',
      },
      LegacyUigfGachaRecordsReadError: {
        OpenInput: 'Failed to open input: {{cause.message}}: {{path}}',
        InvalidInput: 'Invalid json input: {{cause}}',
        InvalidVersion: 'Invalid uigf version string: {{version}}',
        UnsupportedVersion: 'Unsupported uigf version: {{version}} (Allowed: {{allowed}})',
        InconsistentUid: 'Inconsistent with expected uid: expected: {{expected}}, actual: {{actual}}, cursor: {{cursor}}',
        InvalidUid: 'Invalid business uid: {{uid}}',
        InvalidRegionTimeZone: 'Invalid region time zone: {{value}}',
        RequiredField: 'Required field missing: {{field}}, cursor: {{cursor}}',
        MissingMetadataLocale: 'Missing metadata locale: {{locale}}, cursor: {{cursor}}',
        MissingMetadataEntry: 'Missing metadata entry: locale: {{locale}}, {{key}}: {{val}}, cursor: {{cursor}}',
      },
      UigfGachaRecordsWriteError: {
        VacantAccount: 'No account information provided: {{business}}, uid: {{uid}}',
        InvalidUid: 'Invalid business uid: {{business}}, uid: {{uid}}',
        MissingMetadataEntry: 'Missing metadata entry: {{business}}, locale: {{locale}}, {{key}}: {{val}}, cursor: {{cursor}}',
        FailedMappingGachaType: 'Failed to mapping uigf gacha type: {{value}}, cursor: {{cursor}}',
        CreateOutput: 'Failed to create output: {{cause.message}}: {{path}}',
        Serialize: 'Serialization json error: {{cause}}',
      },
      UigfGachaRecordsReadError: {
        OpenInput: 'Failed to open input: {{cause.message}}: {{path}}',
        InvalidInput: 'Invalid json input: {{cause}}',
        InvalidVersion: 'Invalid uigf version string: {{version}}',
        UnsupportedVersion: 'Unsupported uigf version: {{version}} (Allowed: {{allowed}})',
        InvalidUid: 'Invalid business uid: {{business}}, uid: {{uid}}',
        InvalidRegionTimeZone: 'Invalid region time zone: {{business}}, time zone: {{value}}',
        MissingMetadataEntry: 'Missing metadata entry: {{business}}, locale: {{locale}}, {{key}}: {{val}}, cursor: {{cursor}}',
      },
      SrgfGachaRecordsWriteError: {
        InvalidUid: '$t(Errors.LegacyUigfGachaRecordsWriteError.InvalidUid)',
        IncompatibleRecordBusiness: '$t(Errors.LegacyUigfGachaRecordsWriteError.IncompatibleRecordBusiness)',
        IncompatibleRecordOwner: '$t(Errors.LegacyUigfGachaRecordsWriteError.IncompatibleRecordOwner)',
        IncompatibleRecordLocale: '$t(Errors.LegacyUigfGachaRecordsWriteError.IncompatibleRecordLocale)',
        CreateOutput: '$t(Errors.LegacyUigfGachaRecordsWriteError.CreateOutput)',
        Serialize: '$t(Errors.LegacyUigfGachaRecordsWriteError.Serialize)',
      },
      SrgfGachaRecordsReadError: {
        OpenInput: '$t(Errors.LegacyUigfGachaRecordsReadError.OpenInput)',
        InvalidInput: '$t(Errors.LegacyUigfGachaRecordsReadError.InvalidInput)',
        InvalidVersion: '$t(Errors.LegacyUigfGachaRecordsReadError.InvalidVersion)',
        UnsupportedVersion: '$t(Errors.LegacyUigfGachaRecordsReadError.UnsupportedVersion)',
        InconsistentUid: '$t(Errors.LegacyUigfGachaRecordsReadError.InconsistentUid)',
        InvalidUid: '$t(Errors.LegacyUigfGachaRecordsReadError.InvalidUid)',
        InvalidRegionTimeZone: '$t(Errors.LegacyUigfGachaRecordsReadError.InvalidRegionTimeZone)',
        MissingMetadataLocale: '$t(Errors.LegacyUigfGachaRecordsReadError.MissingMetadataLocale)',
        MissingMetadataEntry: '$t(Errors.LegacyUigfGachaRecordsReadError.OpenInMissingMetadataEntryput)',
      },
      PrettyGachaRecordsError: {
        MissingMetadataEntry: 'Missing metadata entry: {{business}}, locale: {{locale}}, name: {{name}}, item id: {{itemId}}',
      },
      LegacyMigrationError: {
        NotFound: 'Legacy database does not exist.',
        SamePath: 'Legacy database path cannot be the same as the current database path.',
        Sqlx: 'An sqlx error occurred: {{cause}}',
        ParseInt: 'Failed to parse integer: {{cause}}',
        SerdeJson: 'Serialization json error: {{cause}}',
        InvalidUid: 'Failed to detect business region for uid: {{uid}} ({{business}})',
        MissingMetadataLocale: 'Missing metadata locale: {{business}}, locale: {{locale}}',
        MissingMetadataEntry: 'Missing metadata entry: {{business}}, locale: {{locale}}, {{key}}: {{val}}',
      },
    },
    Routes: {
      '/': 'Homepage',
      '/Settings': 'Settings',
      '/Gacha/GenshinImpact': '$t(Business.GenshinImpact.Name)',
      '/Gacha/HonkaiStarRail': '$t(Business.HonkaiStarRail.Name)',
      '/Gacha/ZenlessZoneZero': '$t(Business.ZenlessZoneZero.Name)',
    },
    Updater: {
      Updating: {
        Title: 'App update...',
        Progress: 'Downloading: {{value}} / {{max}}',
        Progress_Indeterminate: 'Fetching...',
      },
      Success: {
        Title: 'Download successfully',
        Subtitle: 'The new version has been downloaded. Please restart the application manually.',
        ExitBtn: 'OK',
      },
      UpToDateTitle: 'App already up to date.',
      ErrorTitle: 'App update failed:',
    },
    Webview2Alert: {
      Title: 'Webview2 Runtime:',
      Subtitle: 'If your system\'s Webview2 runtime is lower than version {{min}}, your app\'s icon image assets may not load. Please update here:',
    },
    Pages: {
      Home: {
        Hero: {
          Tag: 'Unofficial · Open source and free',
          Title: 'Managing and analyzing your miHoYo gacha records.',
          Subtitle: 'Supports Genshin Impact, Honkai: Star Rail and Zenless Zone Zero. No need for any local proxy server. Just read the Chromium disk cache file to quickly obtain and analyze your gacha records.',
          Feature1: {
            Title: 'Fast and convenient',
            Subtitle: 'No local proxy server is required, quickly and easily obtain your gacha records.',
          },
          Feature2: {
            Title: 'Record management',
            Subtitle: 'Local database, supports multiple accounts. Importing or exporting UIGF and other exchange formats.',
          },
          TutorialBtn: 'Tutorial',
          Visual: {
            Grid1: {
              Title: 'Pull in total',
              Subtitle: '{{count,number}}',
            },
            Grid2: {
              Title: 'Pulled gold',
              Subtitle: '{{count}}',
            },
            Grid3: {
              Title: 'Last gold',
              Subtitle: '{{count}} pulls',
            },
            Grid4: {
              Title: 'Pity progress',
              Subtitle: '{{count}}%',
            },
            PieCenter: 'Distribution',
            Legend5: '5 Star',
            Legend4: '4 Star',
            Legend3: '3 Star',
          },
        },
        Footer: 'Open source community player development. This software will not ask you for any account password information about ©miHoYo account, nor will it collect any user data. All operations are done locally to ensure data and privacy security.',
      },
      Gacha: {
        LegacyView: {
          GachaItem: {
            Limited: 'Limited',
            Title: {
              Version: 'Version: {{version}}',
              GenshinImpactCharacter2: '$t(Business.GenshinImpact.Gacha.Category.Character)-2',
            },
          },
          Toolbar: {
            Account: {
              Title: 'Account',
              Available: 'Available',
              NoAvailable: 'No account',
              AddNewAccount: 'Add new account',
              Options: {
                Title: 'More options',
                Edit: 'Edit account',
                ChooseAvatar: 'Change avatar',
                Delete: 'Delete account',
              },
              DeleteAccountDialog: {
                Title: 'Confirm to delete account: $t(Business.{{keyofBusinesses}}.Name)',
                Uid: 'UID:',
                DisplayName: 'DisplayName:',
                Whole: 'Delete as a whole:',
                WholeInformation: 'Warning! After enabling, this will delete this account and the gacha records.',
                CancelBtn: 'Cancel',
                SubmitBtn: 'Delete',
              },
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
              More: 'More options',
              FullUpdateBtn: 'Full update',
              ManualInputBtn: 'Manual input URL',
              ManualInputDialog: {
                Title: 'Manual input URL:',
                Placeholder: 'A Gacha URL with full parameters:\n{{example}}',
                Required: 'Please enter the URL value.',
                Validate: 'Please enter a valid URL format.',
                CancelBtn: 'Cancel',
                SubmitBtn: 'Submit',
              },
              Obtain: {
                Loading: 'Obtaining $t(Business.{{keyofBusinesses}}.Gacha.Name) URL...',
                Error: 'Failed to obtain $t(Business.{{keyofBusinesses}}.Gacha.Name) URL:',
              },
              Fetch: {
                Loading: 'Fetching $t(Business.{{keyofBusinesses}}.Gacha.Name) Records...',
                Success: {
                  Title: 'Successfully fetched $t(Business.{{keyofBusinesses}}.Gacha.Name) Records:',
                  AddedBody: 'Added {{changes}} new records.',
                  DeletedBody: 'Delete {{changes}} incorrect records.',
                },
                Error: 'Failed to fetch $t(Business.{{keyofBusinesses}}.Gacha.Name) Records:',
                Fragment: {
                  Idle: 'Idle...',
                  Sleeping: 'Sleeping...',
                  Ready: 'Ready to fetch records: $t(Business.{{keyofBusinesses}}.Gacha.Category.{{value}})',
                  Pagination: 'Fetching records for page {{value}}...',
                  Data: 'Fetched {{value}} new records.',
                  Completed: 'Completed fetching records: $t(Business.{{keyofBusinesses}}.Gacha.Category.{{value}})',
                  Finished: 'All done.',
                },
              },
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
          ChooseAvatarDialog: {
            Title: 'Change avatar: {{identify}}',
            Confirm: 'Use',
            Success: 'Successfully changed the avatar.',
          },
          UpsertAccountDialog: {
            AddTitle: 'Add new account: $t(Business.{{keyofBusinesses}}.Name)',
            AddSuccess: 'Successfully added new account: {{uid}}',
            EditTitle: 'Edit account: $t(Business.{{keyofBusinesses}}.Name)',
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
                Info: 'Uniformed Interchangeable GachaLog Format standard (UIGF) v4.0, v4.1',
              },
              LegacyUigf: {
                Text: 'UIGF (Legacy)',
                Info: 'Uniformed Interchangeable GachaLog Format standard (UIGF) v2.0, v2.1, v2.2, v2.3, v2.4, v3.0',
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
              UigfLocale: {
                Label: 'Locale',
                Info: 'Expected locale of the import file format.',
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
              Success: {
                Title: 'Import Success',
                Body: 'Added {{changes}} new records.',
              },
            },
            ExportForm: {
              Folder: {
                Label: 'Folder',
                Placeholder: 'Export folder',
                SelectBtn: 'Select...',
              },
              Format: {
                Label: 'Format',
              },
              UigfVersion: {
                Label: 'Version',
              },
              UigfMinimized: {
                Label: 'Minimize Data',
                Info: 'When minimizing data is enabled, some optional fields are no longer exported.',
                State_true: 'Enable',
                State_false: 'Disable',
              },
              Pretty: {
                Label: 'Pretty Data',
                Info: 'When enabled, data will be output in an easy to read format.',
                State_true: 'Enable',
                State_false: 'Disable',
              },
              CancelBtn: 'Cancel',
              SubmitBtn: 'Export',
              Success: {
                Title: 'Export Success',
                Body: 'File save to: {{output}}',
              },
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
                Title: 'Latest update date of records: ',
              },
              Tooltips: {
                Fragment1: {
                  Token1: ' Total $t(Business.{{keyofBusinesses}}.Gacha.Name) ',
                  Token2: '{{total, number}}',
                  Token3: ' times, Total value: ',
                  Token4: '{{value, number}}',
                },
                Fragment2: ' $t(Business.{{keyofBusinesses}}.Gacha.Name) records date coverage: ',
                Fragment3: ' Due to official settings, the latest data is subject to a delay of approximately one hour. During peak periods for new banners, this delay may be extended. For precise timing, please refer to the in-game data.',
              },
            },
            Analysis: {
              CardsEntry: {
                Labels: {
                  AverageAndLimited: 'Average / Limited',
                  LimitedWin: 'Limited Win',
                  Limited: 'Limited',
                  Count: 'Count',
                },
              },
              CardsEntryRecord: {
                NextPity: 'Pity Count',
                HardPity: 'Hard!',
                Limited: 'UP',
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
          Migration: {
            Title: 'Database Migration',
            Subtitle: 'Migrate the old version v0 database to this.',
            Migrate: {
              Btn: 'Migrate',
              Loading: {
                Title: 'Migrating...',
                Body: 'Do not exit the application and wait for the migration to complete.',
              },
              Success: {
                Title: 'Migration success:',
                Body: 'Count of accounts: {{accounts}}, Gacha records: {{gachaRecords}}',
              },
              Error: 'Migration failed:',
            },
          },
          General: {
            Title: 'General',
            Language: {
              Title: 'Language',
              Subtitle: 'Change the primary language used by the application.',
            },
            GachaClientareaTab: {
              Title: 'Business Startup Tab',
              Subtitle: 'Select the Startup tab for your default business client area.',
            },
            NavbarBusinessVisible: {
              Title: 'Navbar Business Item Visibility',
              Subtitle: 'Control display status of business-related entries in the navigation bar.',
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
            Font: {
              Title: 'Interface Font',
              Subtitle: 'Change the font of the interface in the application.',
              None: 'None',
            },
          },
          About: {
            Title: 'About',
            Updater: {
              Title: 'Application Update',
              Subtitle: 'Check for application version updates.',
              CheckBtn: 'Check Update',
            },
            Specification: {
              Title: 'Device Specifications',
              CopyBtn: 'Copy',
              OperatingSystem: 'Operating system',
              SystemVersion: 'System version',
              Webview2: 'Webview2',
              Tauri: 'Tauri',
              GitCommit: 'Git commit',
              AppVersion: 'Version',
            },
            Lnk: {
              Title: 'Shortcut lnk',
              Subtitle: 'Create an application desktop shortcut lnk.',
              CreateBtn: 'Create',
              Loading: 'Creating a Shortcut lnk...',
              Success: 'Created successfully.',
              Error: 'Creation failed:',
            },
          },
        },
      },
    },
  },
} as const
