export default {
  common: {
    facet: {
      GenshinImpact: {
        name: '原神',
        player: '旅行者',
        servers: {
          official: '天空岛',
          channel: '世界树',
          oversea: {
            usa: '美服',
            euro: '欧服',
            asia: '亚服',
            cht: '港澳台服'
          }
        },
        gacha: {
          name: '祈愿'
        }
      },
      HonkaiStarRail: {
        name: '崩坏：星穹铁道',
        player: '开拓者',
        servers: {
          official: '星穹列车',
          channel: '无名客',
          oversea: {
            usa: '美服',
            euro: '欧服',
            asia: '亚服',
            cht: '港澳台服'
          }
        },
        gacha: {
          name: '跃迁'
        }
      }
    }
  },
  errorPage: {
    title: '哎呀！',
    subtitle: '抱歉，发生了意外错误。'
  },
  components: {
    core: {
      navbar: {
        tabListRouter: {
          '/': '主页',
          '/accounts': '账户',
          '/settings': '设置',
          '/gacha/GenshinImpact': '$t(common.facet.GenshinImpact.name)',
          '/gacha/HonkaiStarRail': '$t(common.facet.HonkaiStarRail.name)'
        }
      }
    },
    routes: {
      accounts: {
        title: '账户管理',
        facetView: {
          toolbar: {
            title: '$t(common.facet.{{facet}}.name)'
          },
          listItem: {
            server: '服务器：$t(common.facet.{{facet}}.servers.{{path}})'
          }
        }
      },
      settings: {
        title: '设置',
        general: {
          title: '常规',
          language: {
            title: '语言',
            subtitle: '更改应用使用的主要语言。',
            'en-US': '英语 (US)',
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
        },
        about: {
          title: '关于',
          update: {
            title: '应用更新',
            subtitle: '检查应用的版本更新。',
            checkBtn: '检查更新',
            channel: {
              stable: '稳定版 (Stable)',
              insider: '预览版 (Insider)'
            }
          }
        }
      }
    }
  }
}
