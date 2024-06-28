export default {
  Business: {
    GenshinImpact: {
      Name: 'Genshin Impact',
      Player: 'Traveler',
      Currency: 'Primogem',
      Servers: {
        Official: 'Celestia (CN)',
        Channel: 'Irminsul (CN)',
        Oversea: {
          USA: 'America',
          Euro: 'Europe',
          Asia: 'Asia',
          Cht: 'TW,HK,MO'
        }
      },
      Gacha: {
        Name: 'Wish'
      },
      GameDataDir: {
        Example: 'X:/Genshin Impact/Genshin Impact Game/GenshinImpact_Data'
      }
    },
    HonkaiStarRail: {
      Name: 'Honkai: Star Rail',
      Player: 'Trailblazer',
      Currency: 'Stellar Jade',
      Servers: {
        Official: 'Astral Express (CN)',
        Channel: 'The Nameless (CN)',
        Oversea: {
          USA: 'America',
          Euro: 'Europe',
          Asia: 'Asia',
          Cht: 'TW,HK,MO'
        }
      },
      Gacha: {
        Name: 'Wrap'
      },
      GameDataDir: {
        Example: 'X:/Star Rail/Game/StarRail_Data'
      }
    }
  },
  Error: {
    Database: {
      Title: 'Oops! An critical Database error Occurred:',
      FormattingMessage: 'An unexpected critical Database error has Occurred: {{message}} ({{code}})'
    },
    GachaBusiness: {
      Title: 'Oops! An GachaBusiness error Occurred:',
      FormattingMessage: 'An unexpected GachaBusiness error has Occurred: {{message}} ({{kind}})'
    },
    Unexpected: {
      Title: 'An unexpected error has Occurred:',
      FormattingMessage: 'An unexpected error has Occurred: {{message}}'
    }
  },
  Components: {
    Commons: {
      Navbar: {
        TabListRouter: {
          '/': 'Home',
          '/accounts': 'Accounts',
          '/settings': 'Settings',
          '/gacha/GenshinImpact': '$t(Business.GenshinImpact.Name)',
          '/gacha/HonkaiStarRail': '$t(Business.HonkaiStarRail.Name)'
        }
      }
    }
  },
  ErrorPage: {
    Title: 'Oops!',
    Subtitle: 'Sorry, an unexpected error has occurred.'
  },
  Pages: {
    Accounts: {
      Title: 'Accounts management',
      BusinessView: {
        AddOrEditForm: {
          CancelBtn: 'Cancel',
          SubmitBtn: 'Confirm',
          Valid: 'It\'s valid.',
          SuccessAdded: 'Account successfully Added: {{uid}}',
          SuccessEdited: 'Account successfully Edited: {{uid}}',
          Uid: {
            Label: 'UID',
            Placeholder: 'UID for in-game account (nine-digit number)',
            Required: 'Please enter the UID field value.',
            Pattern: 'Please enter the correct UID format.',
            AlreadyExists: 'This account UID already exists.'
          },
          DisplayName: {
            Label: 'Display Name',
            Placeholder: 'Display name of the account (for identification only)',
            Length: 'Maximum character length limit exceeded.'
          },
          GameDataDir: {
            Label: 'Game Data Folder',
            Placeholder: 'Full path to the game data folder. \nFor Example: $t(Business.{{business}}.GameDataDir.Example)',
            Required: 'Please set the game data folder.',
            AutoFindBtn: 'Auto Find',
            ManualFindBtn: 'Manual Choice',
            ManualFindTitle: 'Please choice the game data directory Manually:',
            EmptyFind: 'A valid game data folder was not found. Please check that the game is installed and running.'
          }
        },
        AddOrEditDialog: {
          AddTitle: 'Add new Account: $t(Business.{{business}}.Name)',
          EditTitle: 'Edit Account: $t(Business.{{business}}.Name)'
        },
        Toolbar: {
          Title: '$t(Business.{{business}}.Name)',
          AddAccountBtn: 'Add account'
        },
        List: {
          Empty: 'No accounts added.'
        },
        ListItem: {
          EditAccountBtn: 'Edit account',
          Server: 'Server: $t(Business.{{business}}.Servers.{{path}})'
        }
      }
    },
    Gacha: {
      BusinessView: {
        AccountSelect: {
          Empty: 'No accounts'
        }
      }
    },
    Settings: {
      Title: 'Settings',
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
        ThemeSpace: {
          Title: 'Theme Colors',
          Subtitle: 'Change the primary colors displayed in the application.'
        },
        ThemeColor: {
          Title: 'Preferred Color Schemes',
          Subtitle: 'Toggle the application to use light theme or dark theme.',
          Light: 'Light',
          Dark: 'Dark'
        },
        ThemeZoom: {
          Title: 'Interface Scaling',
          Subtitle: 'Changing the scaling of the interface in the application.'
        }
      },
      About: {
        Title: 'About',
        Update: {
          Title: 'Application Update',
          Subtitle: 'Check for application version updates.',
          CheckBtn: 'Check Update',
          Channel: {
            Stable: 'Stable (Release)',
            Insider: 'Insider (Alpha)'
          }
        }
      }
    }
  }
}
