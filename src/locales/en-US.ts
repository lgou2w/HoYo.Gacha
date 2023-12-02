export default {
  common: {
    facet: {
      GenshinImpact: {
        name: 'Genshin Impact',
        player: 'Traveler',
        servers: {
          official: 'Celestia (CN)',
          channel: 'Irminsul (CN)',
          oversea: {
            usa: 'America',
            euro: 'Europe',
            asia: 'Asia',
            cht: 'TW,HK,MO'
          }
        },
        gacha: {
          name: 'Wish'
        },
        gameDataDir: {
          example: 'X:/Genshin Impact/Genshin Impact Game/GenshinImpact_Data'
        }
      },
      HonkaiStarRail: {
        name: 'Honkai: Star Rail',
        player: 'Trailblazer',
        servers: {
          official: 'Astral Express (CN)',
          channel: 'The Nameless (CN)',
          oversea: {
            usa: 'America',
            euro: 'Europe',
            asia: 'Asia',
            cht: 'TW,HK,MO'
          }
        },
        gacha: {
          name: 'Wrap'
        },
        gameDataDir: {
          example: 'X:/Star Rail/Game/StarRail_Data'
        }
      }
    }
  },
  error: {
    database: {
      title: 'Oops! An critical Database error occurred:',
      formattingMessage: 'An unexpected critical Database error has occurred: {{message}} ({{code}})'
    },
    gachaFacet: {
      title: 'Oops! An GachaFacet error occurred:',
      formattingMessage: 'An unexpected GachaFacet error has occurred: {{message}} ({{kind}})'
    },
    unexpected: {
      title: 'An unexpected error has occurred:',
      formattingMessage: 'An unexpected error has occurred: {{message}}'
    }
  },
  errorPage: {
    title: 'Oops!',
    subtitle: 'Sorry, an unexpected error has occurred.'
  },
  components: {
    core: {
      navbar: {
        tabListRouter: {
          '/': 'Home',
          '/accounts': 'Accounts',
          '/settings': 'Settings',
          '/gacha/GenshinImpact': '$t(common.facet.GenshinImpact.name)',
          '/gacha/HonkaiStarRail': '$t(common.facet.HonkaiStarRail.name)'
        }
      }
    },
    accounts: {
      title: 'Accounts management',
      facetView: {
        createAccountDialog: {
          title: 'Add new account: $t(common.facet.{{facet}}.name)',
          cancelBtn: 'Cancel',
          submitBtn: 'Add',
          form: {
            valid: 'It\'s valid.',
            success: 'Account successfully added: {{uid}}',
            uid: {
              label: 'UID',
              placeholder: 'UID for in-game account (nine-digit number)',
              required: 'Please enter the UID field value.',
              pattern: 'Please enter the correct UID format.',
              alreadyExists: 'This account UID already exists.'
            },
            displayName: {
              label: 'Display Name',
              placeholder: 'Display name of the account (for identification only)',
              length: 'Maximum character length limit exceeded.'
            },
            gameDataDir: {
              label: 'Game Data Folder',
              placeholder: 'Full path to the game data folder. \nFor example: $t(common.facet.{{facet}}.gameDataDir.example)',
              required: 'Please set the game data folder.',
              autoFindBtn: 'Auto Find',
              manualFindBtn: 'Manual Choice',
              emptyFind: 'A valid game data folder was not found. Please check that the game is installed and running.',
              manualFindTitle: 'Please choice the game data directory manually:'
            }
          }
        },
        toolbar: {
          title: '$t(common.facet.{{facet}}.name)',
          createAccount: 'Create account'
        },
        listItem: {
          server: 'Server: $t(common.facet.{{facet}}.servers.{{path}})'
        }
      }
    },
    settings: {
      title: 'Settings',
      general: {
        title: 'General',
        language: {
          title: 'Language',
          subtitle: 'Change the primary language used by the application.',
          'en-US': 'English (US)',
          'zh-Hans': 'Chinese (Simplified)',
          'zh-Hant': 'Chinese (Traditional)'
        }
      },
      appearance: {
        title: 'Appearance',
        themeSpace: {
          title: 'Theme Colors',
          subtitle: 'Change the primary colors displayed in the application.'
        },
        themeColor: {
          title: 'Preferred Color Schemes',
          subtitle: 'Toggle the application to use light theme or dark theme.',
          light: 'Light',
          dark: 'Dark'
        },
        themeZoom: {
          title: 'Interface Scaling',
          subtitle: 'Changing the scaling of the interface in the application.'
        }
      },
      about: {
        title: 'About',
        update: {
          title: 'Application Update',
          subtitle: 'Check for application version updates.',
          checkBtn: 'Check Update',
          channel: {
            stable: 'Stable (Release)',
            insider: 'Insider (Alpha)'
          }
        }
      }
    }
  }
}
