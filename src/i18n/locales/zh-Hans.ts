export default {
  language: 'zh-Hans',
  matches: ['zh-CN', 'zh-SG'],
  constants: {
    text: '简体中文',
    dayjs: 'zh-cn',
  },
  translation: {
    Business: {
      GenshinImpact: {
        Name: '原神',
        Player: {
          Name: '旅行者',
          Girl: '荧',
          Boy: '空',
        },
        Currency: {
          Name01: '原石',
          Name02: '创世结晶',
        },
        Gacha: {
          Name: '祈愿',
          Ticket01: '相遇之缘',
          Ticket02: '纠缠之缘',
          Category: {
            Beginner: {
              Badge: '新手祈愿',
              Title: '初行者推荐祈愿',
            },
            Permanent: {
              Badge: '常驻祈愿',
              Title: '奔行世间',
            },
            Character: '角色活动祈愿',
            Weapon: '武器活动祈愿',
            Chronicled: '集录祈愿',
            Aggregated: '总计',
          },
        },
      },
      HonkaiStarRail: {
        Name: '崩坏：星穹铁道',
        Player: {
          Name: '开拓者',
          Girl: '星',
          Boy: '穹',
        },
        Currency: {
          Name01: '星琼',
          Name02: '古老梦华',
        },
        Gacha: {
          Name: '跃迁',
          Ticket01: '星轨通票',
          Ticket02: '星轨专票',
          Category: {
            Beginner: {
              Badge: '新手跃迁',
              Title: '始发跃迁',
            },
            Permanent: {
              Badge: '常驻跃迁',
              Title: '群星跃迁',
            },
            Character: '角色活动跃迁',
            Weapon: '光锥活动跃迁',
            Aggregated: '总计',
          },
        },
      },
      ZenlessZoneZero: {
        Name: '绝区零',
        Player: {
          Name: '绳匠',
          Girl: '铃',
          Boy: '哲',
        },
        Currency: {
          Name01: '菲林',
          Name02: '菲林底片',
        },
        Gacha: {
          Name: '调频',
          Ticket01: '原装母带',
          Ticket02: '加密母带',
          Ticket03: '邦布券',
          Category: {
            Permanent: {
              Badge: '常驻频段',
              Title: '热门卡司',
            },
            Character: '独家频段',
            Weapon: '音擎频段',
            Bangboo: {
              Badge: '邦布频段',
              Title: '卓越搭档',
            },
            Aggregated: '总计',
          },
        },
      },
    },
    Routes: {
      '/': '主页',
      '/Settings': '设置',
      '/Gacha/GenshinImpact': '$t(Business.GenshinImpact.Name)',
      '/Gacha/HonkaiStarRail': '$t(Business.HonkaiStarRail.Name)',
      '/Gacha/ZenlessZoneZero': '$t(Business.ZenlessZoneZero.Name)',
    },
    Pages: {
      Gacha: {
        LegacyView: {
          GachaItem: {
            Limited: '限定',
          },
          Toolbar: {
            Account: {
              Title: '账号',
              Available: '可用',
              NoAvailable: '无账号',
              AddNewAccount: '添加新的账号',
            },
            Url: {
              Title: '$t(Business.{{keyofBusinesses}}.Gacha.Name)链接',
              Deadline: '(有效期 {{deadline}})',
              Expired: '(已失效)',
              Input: {
                Placeholder: '$t(Business.{{keyofBusinesses}}.Gacha.Name)链接',
              },
              CopyBtn: '复制',
              UpdateBtn: '更新',
              More: '更多操作',
              FullUpdateBtn: '全量更新',
              ManualInputBtn: '手动输入链接',
              Obtain: {
                Loading: '获取$t(Business.{{keyofBusinesses}}.Gacha.Name)链接...',
                Error: {
                  Title: '获取$t(Business.{{keyofBusinesses}}.Gacha.Name)链接失败：',
                  Body: '{{message}}',
                },
              },
              Fetch: {
                Loading: '拉取$t(Business.{{keyofBusinesses}}.Gacha.Name)记录...',
                Success: {
                  Title: '拉取$t(Business.{{keyofBusinesses}}.Gacha.Name)记录成功：',
                  AddedBody: '新增 {{changes}} 条新记录。',
                  RemovedBody: '移除 {{changes}} 条不正确记录。',
                },
                Error: {
                  Title: '拉取$t(Business.{{keyofBusinesses}}.Gacha.Name)记录失败：',
                  Body: '{{message}}',
                },
              },
            },
            Tabs: {
              Title: '标签页',
              Overview: '概览',
              Analysis: '分析',
              Chart: '统计',
            },
            Convert: {
              Import: {
                Title: '导入',
              },
              Export: {
                Title: '导出',
              },
            },
          },
          UpsertAccountForm: {
            CancelBtn: '取消',
            SubmitBtn: '确定',
            Valid: '有效。',
            Uid: {
              Label: 'UID',
              Placeholder: '游戏内账号的 UID',
              Required: '请输入 UID 字段值。',
              Pattern: '请输入正确的 UID 格式。',
              AlreadyExists: '该账号 UID 已经存在。',
            },
            DisplayName: {
              Label: '显示名称',
              Placeholder: '账号的显示名称（可选，仅用于识别）',
              Length: '超过最大字符长度限制。',
            },
            DataFolder: {
              Label: '游戏数据目录',
              Placeholder: '游戏数据目录的完整路径。\n例如："$t(Business.{{keyofBusinesses}}.DataFolder.Example)"',
              Required: '请设置游戏数据目录。',
              AutoFindBtn: '自动查找',
              ManualFindBtn: '手动选择',
              ManualFindTitle: '请选择$t(Business.{{keyofBusinesses}}.Name)的游戏数据目录',
              EmptyFind: '未找到有效的游戏数据目录。请检查游戏是否安装并运行。',
            },
          },
          UpsertAccountDialog: {
            AddTitle: '添加新账号："$t(Business.{{keyofBusinesses}}.Name)"',
            AddSuccess: '成功添加新账号：{{uid}}',
            EditTitle: '编辑账号："$t(Business.{{keyofBusinesses}}.Name)"',
            EditSuccess: '成功编辑账号：{{uid}}',
          },
          DataConvert: {
            Dialog: {
              ImportTitle: '导入$t(Business.{{keyofBusinesses}}.Gacha.Name)记录',
              ExportTitle: '导出$t(Business.{{keyofBusinesses}}.Gacha.Name)记录',
            },
            Format: {
              Uigf: {
                Text: 'UIGF',
                Info: '统一可交换抽卡记录标准 (UIGF) v4.0',
              },
              LegacyUigf: {
                Text: 'UIGF (Legacy)',
                Info: '统一可交换抽卡记录标准 (UIGF) v2.2, v2.3, v2.4, v3.0',
              },
              Srgf: {
                Text: 'SRGF',
                Info: '星穹铁道抽卡记录标准 (SRGF) v1.0',
              },
            },
            ImportForm: {
              File: {
                Label: '文件',
                Placeholder: '待导入文件',
                SelectBtn: '选择...',
              },
              Format: {
                Label: '格式',
              },
              Locale: {
                Label: '语言',
                Info: '导入文件格式的预期语言区域。',
              },
              SaveOnConflict: {
                Label: '保存冲突时',
                Values: {
                  Nothing: '忽略',
                  Update: '更新',
                },
              },
              CancelBtn: '取消',
              SubmitBtn: '导入',
              Success: {
                Title: '导入成功',
                Body: '新增 {{changes}} 条新记录。',
              },
            },
          },
          Clientarea: {
            Overview: {
              GridCard: {
                Labels: {
                  Total: '共 {{count, number}} 抽',
                  GoldenSum: '已出 {{count, number}} 金',
                  NextPity: '已垫 {{count}} 抽',
                  Beginner: '新手：{{name}}',
                  Average: '平均每金：{{count}}',
                  Percentage: '出金率：{{count}}%',
                  LimitedAverage: '限定平均每金：{{count}}',
                  LimitedPercentage: '限定出金率：{{count}}%',
                  LastGolden: '最近出金：{{name}} ({{usedPity}})',
                  LastGoldenNone: '最近出金：无',
                },
              },
              LastUpdated: {
                Title: '最近$t(Business.{{keyofBusinesses}}.Gacha.Name)记录更新日期：',
              },
              Tooltips: {
                Fragment1: {
                  Token1: '总计$t(Business.{{keyofBusinesses}}.Gacha.Name) ',
                  Token2: '{{total, number}}',
                  Token3: ' 次，总价值：',
                  Token4: '{{value, number}}',
                },
                Fragment2: '$t(Business.{{keyofBusinesses}}.Gacha.Name)记录日期覆盖范围：',
                Fragment3: '因官方设定，最新数据存在约一小时的延迟。如遇到新池高峰期延迟可能更久。具体时间请以游戏内数据为准。',
              },
            },
          },
        },
      },
      Settings: {
        Hero: {
          OfficialBtn: '官方网站',
          FeedbackBtn: '问题反馈',
          LicenseNote: '仅供个人学习交流使用。请勿用于任何商业或违法违规用途。',
        },
        Options: {
          Cloud: {
            Test: {
              Title: '云存储',
              Subtitle: '通过云存储服务，随时随地同步数据，避免数据丢失。',
            },
          },
          General: {
            Title: '常规',
            Language: {
              Title: '语言',
              Subtitle: '更改应用使用的主要语言。',
            },
          },
          Appearance: {
            Title: '外观',
            Namespace: {
              Title: '主题颜色',
              Subtitle: '更改应用中显示的主要颜色。',
            },
            ColorScheme: {
              Title: '偏好配色方案',
              Subtitle: '切换应用使用浅色主题或深色主题。',
              Light: '浅色',
              Dark: '深色',
            },
            ScaleLevel: {
              Title: '界面缩放',
              Subtitle: '更改应用中界面的缩放等级。',
            },
          },
          About: {
            Title: '关于',
            Updater: {
              Title: '应用更新',
              Subtitle: '检查应用的版本更新。',
              CheckBtn: '检查更新',
              Channel: {
                Stable: '稳定版 (Stable)',
                Insider: '预览版 (Insider)',
              },
            },
            Specification: {
              Title: '设备规格',
              CopyBtn: '复制',
              OperatingSystem: '操作系统',
              SystemVersion: '系统版本',
              SystemType: '系统类型',
              Webview2: 'Webview2',
              Tauri: 'Tauri',
            },
          },
        },
      },
    },
  },
} as const
