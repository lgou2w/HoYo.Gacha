export default {
  errorPage: {
    title: '哎呀！',
    subtitle: '抱歉，發生了意外錯誤。'
  },
  components: {
    core: {
      navbar: {
        tabListRouter: {
          '/': '主頁',
          '/accounts': '賬戶',
          '/settings': '設定',
          '/gacha/genshin': '祈願',
          '/gacha/starrail': '躍遷'
        }
      }
    },
    routes: {
      settings: {
        general: {
          title: '常規',
          language: {
            title: '語言',
            subtitle: '更改應用使用的主要語言。',
            'en-US': '英語 (US)',
            'zh-Hans': '簡體中文',
            'zh-Hant': '繁體中文'
          }
        },
        appearance: {
          title: '外觀',
          themeSpace: {
            title: '主題顏色',
            subtitle: '更改應用中顯示的主要顏色。'
          },
          themeColor: {
            title: '偏好配色方案',
            subtitle: '切換應用使用淺色主題或暗色主題。',
            light: '淺色',
            dark: '暗色'
          },
          themeZoom: {
            title: '介面縮放',
            subtitle: '更改應用中介面的縮放比例。'
          }
        },
        about: {
          title: '關於',
          update: {
            title: '應用更新',
            subtitle: '檢查應用的版本更新。',
            checkBtn: '檢查更新',
            channel: {
              stable: '穩定版 (Stable)',
              insider: '預覽版 (Insider)'
            }
          }
        }
      }
    }
  }
}
