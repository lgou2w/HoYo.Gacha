export default {
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
          '/gacha/genshin': 'Wish',
          '/gacha/starrail': 'Wrap'
        }
      }
    },
    routes: {
      settings: {
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
