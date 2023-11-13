export default {
  errorPage: {
    title: '哎呀！',
    subtitle: '抱歉，发生了意外错误。'
  },
  router: {
    '/': '主页',
    '/accounts': '账户',
    '/settings': '设置',
    '/gacha/genshin': '祈愿',
    '/gacha/starrail': '跃迁'
  },
  routes: {
    settings: {
      general: {
        title: '常规',
        language: {
          title: '语言',
          subtitle: '更改应用使用的主要语言。',
          'en-US': '英语',
          'zh-Hans': '简体中文',
          'zh-Hant': '繁体中文'
        }
      },
      appearance: {
        title: '外观',
        themeSpace: {
          title: '主题颜色',
          subtitle: '更改应用中显示的主要颜色。'
        },
        themeColor: {
          title: '偏好配色方案',
          subtitle: '切换应用使用浅色主题或暗色主题。',
          light: '浅色',
          dark: '暗色'
        },
        themeZoom: {
          title: '界面缩放',
          subtitle: '更改应用中界面的缩放比例。'
        }
      }
    }
  }
}
