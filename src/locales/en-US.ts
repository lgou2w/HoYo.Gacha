export default {
  errorPage: {
    title: 'Oops!',
    subtitle: 'Sorry, an unexpected error has occurred.'
  },
  router: {
    '/': 'Home',
    '/accounts': 'Accounts',
    '/settings': 'Settings',
    '/gacha/genshin': 'Wish',
    '/gacha/starrail': 'Wrap'
  },
  routes: {
    settings: {
      general: {
        title: 'General',
        language: {
          title: 'Language',
          subtitle: 'Change the primary language used by the application.',
          'en-US': 'English',
          'zh-Hans': 'Simplified Chinese',
          'zh-Hant': 'Traditional Chinese'
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
      }
    }
  }
}
