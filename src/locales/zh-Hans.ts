export default {
  business: {
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
      },
      gameDataDir: {
        example: 'X:/Genshin Impact/Genshin Impact Game/YuanShen_Data'
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
      },
      gameDataDir: {
        example: 'X:/Star Rail/Game/StarRail_Data'
      }
    }
  },
  error: {
    database: {
      title: '哎呀！发生意外严重的数据库错误：',
      formattingMessage: '发生意外严重的数据库错误：{{message}} ({{code}})'
    },
    gachaBusiness: {
      title: '哎呀！发生意外的 GachaBusiness 错误：',
      formattingMessage: '发生意外的 GachaBusiness 错误：{{message}} ({{kind}})'
    },
    unexpected: {
      title: '发生意外错误：',
      formattingMessage: '发生意外错误：{{message}}'
    }
  },
  errorPage: {
    title: '哎呀！',
    subtitle: '抱歉，发生意外错误。'
  },
  components: {
    core: {
      navbar: {
        tabListRouter: {
          '/': '主页',
          '/accounts': '账户',
          '/settings': '设置',
          '/gacha/GenshinImpact': '$t(business.GenshinImpact.name)',
          '/gacha/HonkaiStarRail': '$t(business.HonkaiStarRail.name)'
        }
      }
    },
    accounts: {
      title: '账户管理',
      businessView: {
        addOrEditForm: {
          cancelBtn: '取消',
          submitBtn: '确定',
          valid: '有效。',
          successAdded: '添加账户 {{uid}} 成功。',
          successEdited: '编辑账户 {{uid}} 成功。',
          uid: {
            label: 'UID',
            placeholder: '游戏内账户的 UID（9 位数字）',
            required: '请输入 UID 字段值。',
            pattern: '请输入正确的 UID 格式。',
            alreadyExists: '该账户 UID 已经存在。'
          },
          displayName: {
            label: '显示名称',
            placeholder: '账户的显示名称（仅用于识别）',
            length: '超过最大字符长度限制。'
          },
          gameDataDir: {
            label: '游戏数据目录',
            placeholder: '游戏数据目录的完整路径。\n例如：$t(business.{{business}}.gameDataDir.example)',
            required: '请设置游戏数据目录。',
            autoFindBtn: '自动查找',
            manualFindBtn: '手动选择',
            manualFindTitle: '请手动选择游戏数据目录：',
            emptyFind: '未找到有效的游戏数据目录。请检查游戏是否安装并运行。'
          }
        },
        addOrEditDialog: {
          addTitle: '添加新账户：$t(business.{{business}}.name)',
          editTitle: '编辑账户：$t(business.{{business}}.name)'
        },
        toolbar: {
          title: '$t(business.{{business}}.name)',
          addAccountBtn: '添加账户'
        },
        list: {
          empty: '尚未添加任何账户。'
        },
        listItem: {
          editAccountBtn: '编辑账户',
          server: '服务器：$t(business.{{business}}.servers.{{path}})'
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
