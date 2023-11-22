export default {
  common: {
    facet: {
      GenshinImpact: {
        name: '原神',
        player: '旅行者',
        servers: {
          official: '天空島',
          channel: '世界樹',
          oversea: {
            usa: '美服',
            euro: '歐服',
            asia: '亞服',
            cht: '港澳台服'
          }
        },
        gacha: {
          name: '祈願'
        }
      },
      HonkaiStarRail: {
        name: '崩壞：星穹鐵道',
        player: '開拓者',
        servers: {
          official: '星穹列車',
          channel: '無名客',
          oversea: {
            usa: '美服',
            euro: '歐服',
            asia: '亞服',
            cht: '港澳台服'
          }
        },
        gacha: {
          name: '躍遷'
        }
      }
    }
  },
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
          '/gacha/GenshinImpact': '$t(common.facet.GenshinImpact.name)',
          '/gacha/HonkaiStarRail': '$t(common.facet.HonkaiStarRail.name)'
        }
      }
    },
    routes: {
      accounts: {
        title: '帳戶管理',
        facetView: {
          toolbar: {
            title: '$t(common.facet.{{facet}}.name)'
          },
          listItem: {
            server: '服務器：$t(common.facet.{{facet}}.servers.{{path}})'
          }
        }
      },
      settings: {
        title: '設定',
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
