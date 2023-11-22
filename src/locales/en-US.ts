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
        }
      }
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
    routes: {
      accounts: {
        title: 'Accounts management',
        facetView: {
          toolbar: {
            title: '$t(common.facet.{{facet}}.name)'
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
}
