export default {
  Business: {
    GenshinImpact: {
      Name: '原神',
      Player: '旅行者',
      Servers: {
        Official: '天空岛',
        Channel: '世界树',
        Oversea: {
          USA: '美服',
          Euro: '欧服',
          Asia: '亚服',
          Cht: '港澳台服'
        }
      },
      Gacha: {
        Name: '祈愿'
      },
      GameDataDir: {
        Example: 'X:/Genshin Impact/Genshin Impact Game/YuanShen_Data'
      }
    },
    HonkaiStarRail: {
      Name: '崩坏：星穹铁道',
      Player: '开拓者',
      Servers: {
        Official: '星穹列车',
        Channel: '无名客',
        Oversea: {
          USA: '美服',
          Euro: '欧服',
          Asia: '亚服',
          Cht: '港澳台服'
        }
      },
      Gacha: {
        Name: '跃迁'
      },
      GameDataDir: {
        Example: 'X:/Star Rail/Game/StarRail_Data'
      }
    }
  },
  Error: {
    Database: {
      Title: '哎呀！发生意外严重的数据库错误：',
      FormattingMessage: '发生意外严重的数据库错误：{{message}} ({{code}})'
    },
    GachaBusiness: {
      Title: '哎呀！发生意外的业务错误：',
      FormattingMessage: '发生意外的业务错误：{{message}} ({{kind}})'
    },
    Unexpected: {
      Title: '发生意外错误：',
      FormattingMessage: '发生意外错误：{{message}}'
    }
  },
  Components: {
    Commons: {
      Navbar: {
        TabListRouter: {
          '/': '主页',
          '/accounts': '账户',
          '/settings': '设置',
          '/gacha/GenshinImpact': '$t(Business.GenshinImpact.Name)',
          '/gacha/HonkaiStarRail': '$t(Business.HonkaiStarRail.Name)'
        }
      }
    }
  },
  ErrorPage: {
    Title: '哎呀！',
    Subtitle: '抱歉，发生意外错误。'
  },
  Pages: {
    Accounts: {
      Title: '账户管理',
      BusinessView: {
        AddOrEditForm: {
          CancelBtn: '取消',
          SubmitBtn: '确定',
          Valid: '有效。',
          SuccessAdded: '添加账户 {{uid}} 成功。',
          SuccessEdited: '编辑账户 {{uid}} 成功。',
          Uid: {
            Label: 'UID',
            Placeholder: '游戏内账户的 UID（9 位数字）',
            Required: '请输入 UID 字段值。',
            Pattern: '请输入正确的 UID 格式。',
            AlreadyExists: '该账户 UID 已经存在。'
          },
          DisplayName: {
            Label: '显示名称',
            Placeholder: '账户的显示名称（仅用于识别）',
            Length: '超过最大字符长度限制。'
          },
          GameDataDir: {
            Label: '游戏数据目录',
            Placeholder: '游戏数据目录的完整路径。\n例如：$t(Business.{{business}}.GameDataDir.Example)',
            Required: '请设置游戏数据目录。',
            AutoFindBtn: '自动查找',
            ManualFindBtn: '手动选择',
            ManualFindTitle: '请手动选择游戏数据目录：',
            EmptyFind: '未找到有效的游戏数据目录。请检查游戏是否安装并运行。'
          }
        },
        AddOrEditDialog: {
          AddTitle: '添加新账户：$t(Business.{{business}}.Name)',
          EditTitle: '编辑账户：$t(Business.{{business}}.Name)'
        },
        Toolbar: {
          Title: '$t(Business.{{business}}.Name)',
          AddAccountBtn: '添加账户'
        },
        List: {
          Empty: '尚未添加任何账户。'
        },
        ListItem: {
          EditAccountBtn: '编辑账户',
          Server: '服务器：$t(Business.{{business}}.Servers.{{path}})'
        }
      }
    },
    Settings: {
      Title: '设置',
      General: {
        Title: '常规',
        Language: {
          Title: '语言',
          Subtitle: '更改应用使用的主要语言。',
          'en-US': '英语 (US)',
          'zh-Hans': '简体中文',
          'zh-Hant': '繁体中文'
        }
      },
      Appearance: {
        Title: '外观',
        ThemeSpace: {
          Title: '主题颜色',
          Subtitle: '更改应用中显示的主要颜色。'
        },
        ThemeColor: {
          Title: '偏好配色方案',
          Subtitle: '切换应用使用浅色主题或暗色主题。',
          Light: '浅色',
          Dark: '暗色'
        },
        ThemeZoom: {
          Title: '界面缩放',
          Subtitle: '更改应用中界面的缩放比例。'
        }
      },
      About: {
        Title: '关于',
        Update: {
          Title: '应用更新',
          Subtitle: '检查应用的版本更新。',
          CheckBtn: '检查更新',
          Channel: {
            Stable: '稳定版 (Stable)',
            Insider: '预览版 (Insider)'
          }
        }
      }
    }
  }
}
