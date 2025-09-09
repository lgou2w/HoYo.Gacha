/* eslint-disable camelcase */

export default {
  language: 'zh-Hans',
  matches: ['zh-CN', 'zh-SG'],
  constants: {
    text: '简体中文',
    dayjs: 'zh-cn',
    gacha: 'zh-cn',
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
            Beginner: '新手祈愿',
            Beginner_Title: '初行者推荐祈愿',
            Permanent: '常驻祈愿',
            Permanent_Title: '奔行世间',
            Character: '角色活动祈愿',
            Weapon: '武器活动祈愿',
            Weapon_Title: '神铸赋形',
            Chronicled: '集录祈愿',
            Aggregated: '总计',
          },
        },
        DataFolder: {
          Example: 'X:/Genshin Impact/Genshin Impact Game/YuanShen_Data',
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
            Beginner: '新手跃迁',
            Beginner_Title: '始发跃迁',
            Permanent: '常驻跃迁',
            Permanent_Title: '群星跃迁',
            Character: '角色活动跃迁',
            Weapon: '光锥活动跃迁',
            CollaborationCharacter: '角色联动跃迁',
            CollaborationWeapon: '光锥联动跃迁',
            Aggregated: '总计',
          },
        },
        DataFolder: {
          Example: 'X:/Star Rail/Game/StarRail_Data',
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
            Permanent: '常驻频段',
            Permanent_Title: '热门卡司',
            Character: '独家频段',
            Weapon: '音擎频段',
            Bangboo: '邦布频段',
            Bangboo_Title: '卓越搭档',
            Aggregated: '总计',
            Aggregated_NoBangboo: '(不含邦布频段)',
          },
        },
        DataFolder: {
          Example: 'X:/ZenlessZoneZero Game/ZenlessZoneZero_Data',
        },
        Ranking: {
          Golden: 'S级',
          Purple: 'A级',
          Blue: 'B级',
        },
      },
    },
    Errors: {
      Unexpected: '发生意外错误：{{message}}',
      SqlxError: '发生 sqlx 错误：{{message}}',
      SqlxDatabaseError: '发生 sqlx 数据库错误：{{message}}',
      DataFolderError: {
        Invalid: '无效的游戏数据目录。',
        UnityLogFileNotFound: 'Unity 日志文件未存在：{{path}}',
        OpenUnityLogFile: '打开 Unity 日志文件时错误：{{cause.message}：{{path}}',
        Vacant: '空缺的游戏数据目录。',
      },
      GachaUrlError: {
        WebCachesNotFound: '网页缓存路径未存在：{{path}}',
        OpenWebCaches: '打开网页缓存时错误：{{cause.message}}：{{path}}',
        ReadDiskCache: '读取硬盘缓存时错误：{{cause.message}}：{{path}}',
        EmptyData: '抽卡链接返回空数据。最新数据会有延迟，请稍后重试！',
        NotFound: '未找到有效的抽卡链接。请尝试在游戏内打开历史记录界面！',
        Illegal: '非法的抽卡链接：{{url}}',
        IllegalGameBiz: '非法的抽卡链接 GameBiz 参数：{{value}}',
        InvalidParams: '无效的抽卡链接参数：{{params}}',
        Reqwest: '请求抽卡链接时错误：{{cause}}',
        AuthkeyTimeout: '抽卡链接已经过期失效。请重新在游戏内打开抽卡历史记录界面！',
        VisitTooFrequently: '抽卡链接访问过于频繁。请稍后重试！',
        UnexpectedResponse: '抽卡链接返回了意外响应：{{message}} (返回码：{{retcode}})',
        MissingMetadataEntry: '缺失元数据条目：{{business}}，语言：{{locale}}，名称：{{name}}',
        InconsistentUid: '抽卡链接的拥有者 UID 不匹配：{{actuals}} (预期：{{expected}})',
      },
      LegacyUigfGachaRecordsWriteError: {
        InvalidUid: '无效的业务 UID：{{uid}}',
        IncompatibleRecordBusiness: '不兼容的记录业务：{{business}}，ID：{{id}}，名称：{{name}}，游标：{{cursor}}',
        IncompatibleRecordOwner: '不兼容的记录所有者：预期：{{expected}}，实际：{{actual}}，游标：{{cursor}}',
        IncompatibleRecordLocale: '不兼容的记录语言：预期：{{expected}}，实际：{{actual}}，游标：{{cursor}}',
        FailedMappingGachaType: '映射 UIGF 的 GachaType 失败：{{value}}，游标：{{cursor}}',
        CreateOutput: '创建输出失败：{{cause.message}}：{{path}}',
        Serialize: '序列化 JSON 错误：{{cause}}',
      },
      LegacyUigfGachaRecordsReadError: {
        OpenInput: '打开输入失败：{{cause.message}}：{{path}}',
        InvalidInput: '无效的 JSON 输入：{{cause}}',
        InvalidVersion: '无效的 UIGF 版本字符串：{{version}}',
        UnsupportedVersion: '不支持的 UIGF 版本：{{version}} (允许的：{{allowed}})',
        InconsistentUid: '与预期 UID 不一致：预期：{{expected}}，实际：{{actual}}，游标：{{cursor}}',
        InvalidUid: '无效的业务 UID：{{uid}}',
        InvalidRegionTimeZone: '无效的区域时区：{{value}}',
        RequiredField: '缺失必选字段：{{field}}，游标：{{cursor}}',
        MissingMetadataLocale: '缺失元数据语言：{{locale}}，游标：{{cursor}}',
        MissingMetadataEntry: '缺失元数据条目：语言：{{locale}}，{{key}}：{{val}}，游标：{{cursor}}',
      },
      UigfGachaRecordsWriteError: {
        VacantAccount: '没有提供账号信息：{{business}}，UID：{{uid}}',
        InvalidUid: '无效的业务 UID：{{business}}，UID：{{uid}}',
        MissingMetadataEntry: '缺失元数据条目：{{business}}，语言：{{locale}}，{{key}}：{{val}}，游标：{{cursor}}',
        FailedMappingGachaType: '映射 UIGF 的 GachaType 失败：{{value}}，游标：{{cursor}}',
        CreateOutput: '创建输出失败：{{cause.message}}：{{path}}',
        Serialize: '序列化 JSON 错误：{{cause}}',
      },
      UigfGachaRecordsReadError: {
        OpenInput: '打开输入失败：{{cause.message}}：{{path}}',
        InvalidInput: '无效的 JSON 输入：{{cause}}',
        InvalidVersion: '无效的 UIGF 版本字符串：{{version}}',
        UnsupportedVersion: '不支持的 UIGF 版本：{{version}} (允许的：{{allowed}})',
        InvalidUid: '无效的业务 UID：{{business}}，UID：{{uid}}',
        InvalidRegionTimeZone: '无效的区域时区：{{business}}，时区：{{value}}',
        MissingMetadataEntry: '缺失元数据条目：{{business}}，语言：{{locale}}，{{key}}：{{val}}，游标：{{cursor}}',
      },
      SrgfGachaRecordsWriteError: {
        InvalidUid: '$t(Errors.LegacyUigfGachaRecordsWriteError.InvalidUid)',
        IncompatibleRecordBusiness: '$t(Errors.LegacyUigfGachaRecordsWriteError.IncompatibleRecordBusiness)',
        IncompatibleRecordOwner: '$t(Errors.LegacyUigfGachaRecordsWriteError.IncompatibleRecordOwner)',
        IncompatibleRecordLocale: '$t(Errors.LegacyUigfGachaRecordsWriteError.IncompatibleRecordLocale)',
        CreateOutput: '$t(Errors.LegacyUigfGachaRecordsWriteError.CreateOutput)',
        Serialize: '$t(Errors.LegacyUigfGachaRecordsWriteError.Serialize)',
      },
      SrgfGachaRecordsReadError: {
        OpenInput: '$t(Errors.LegacyUigfGachaRecordsReadError.OpenInput)',
        InvalidInput: '$t(Errors.LegacyUigfGachaRecordsReadError.InvalidInput)',
        InvalidVersion: '$t(Errors.LegacyUigfGachaRecordsReadError.InvalidVersion)',
        UnsupportedVersion: '$t(Errors.LegacyUigfGachaRecordsReadError.UnsupportedVersion)',
        InconsistentUid: '$t(Errors.LegacyUigfGachaRecordsReadError.InconsistentUid)',
        InvalidUid: '$t(Errors.LegacyUigfGachaRecordsReadError.InvalidUid)',
        InvalidRegionTimeZone: '$t(Errors.LegacyUigfGachaRecordsReadError.InvalidRegionTimeZone)',
        MissingMetadataLocale: '$t(Errors.LegacyUigfGachaRecordsReadError.MissingMetadataLocale)',
        MissingMetadataEntry: '$t(Errors.LegacyUigfGachaRecordsReadError.OpenInMissingMetadataEntryput)',
      },
      PrettyGachaRecordsError: {
        MissingMetadataEntry: '缺失元数据条目：{{business}}，语言：{{locale}}，名称：{{name}}，物品 ID：{{itemId}}',
      },
      LegacyMigrationError: {
        NotFound: '旧数据库未存在。',
        SamePath: '旧数据库路径不能与当前数据库路径相同。',
        Sqlx: '发生 sqlx 错误：{{cause}}',
        ParseInt: '无法解析整数：{{cause}}',
        SerdeJson: '序列化 JSON 错误：{{cause}}',
        InvalidUid: '无法检测 UID 的业务区域：{{uid}} ({{business}})',
        MissingMetadataLocale: '缺失元数据语言：{{business}}，语言：{{locale}}',
        MissingMetadataEntry: '缺失元数据条目：{{business}}, 语言：{{locale}}，{{key}}：{{val}}',
      },
    },
    Routes: {
      '/': '主页',
      '/Settings': '设置',
      '/Gacha/GenshinImpact': '$t(Business.GenshinImpact.Name)',
      '/Gacha/HonkaiStarRail': '$t(Business.HonkaiStarRail.Name)',
      '/Gacha/ZenlessZoneZero': '$t(Business.ZenlessZoneZero.Name)',
    },
    Updater: {
      Updating: {
        Title: '应用更新...',
        Progress: '下载中：{{value}} / {{max}}',
        Progress_Indeterminate: '获取中...',
      },
      Success: {
        Title: '下载成功',
        Subtitle: '新版本下载完成，请手动重启应用！',
        ExitBtn: '确认',
      },
      UpToDateTitle: '应用已是最新版本。',
      ErrorTitle: '应用更新失败：',
    },
    Webview2Alert: {
      Title: 'Webview2 运行时：',
      Subtitle: '如果您系统的 Webview2 运行时版本低于 {{min}}，则应用的图标图片资源可能无法加载。请在此处更新：',
    },
    Pages: {
      Home: {
        Hero: {
          Tag: '非官方工具 · 开源免费',
          Title: '管理分析你的 miHoYo 抽卡记录',
          Subtitle: '支持原神、崩坏：星穹铁道、绝区零等游戏。无需任何本地代理服务器。只需读取 Chromium 缓存文件，快速获取并分析你的抽卡记录。',
          Feature1: {
            Title: '快捷、方便',
            Subtitle: '无需任何本地代理服务器，快速便捷地获取你的抽卡记录数据。',
          },
          Feature2: {
            Title: '记录管理',
            Subtitle: '本地数据库，支持游戏的多个账号。支持导入或导出 UIGF 等多种交换格式。',
          },
          TutorialBtn: '使用教程',
          Visual: {
            Grid1: {
              Title: '总抽数',
              Subtitle: '{{count,number}}',
            },
            Grid2: {
              Title: '已出金',
              Subtitle: '{{count}}',
            },
            Grid3: {
              Title: '最近出金',
              Subtitle: '{{count}} 抽',
            },
            Grid4: {
              Title: '保底进度',
              Subtitle: '{{count}}%',
            },
            PieCenter: '物品分布',
            Legend5: '5 星',
            Legend4: '4 星',
            Legend3: '3 星',
          },
        },
        Footer: '开源社区玩家开发。本软件不会向您索要任何关于 ©miHoYo 账户的账号密码信息，也不会收集任何用户数据。所有操作均在本地完成，以确保数据和隐私安全。',
      },
      Gacha: {
        LegacyView: {
          GachaItem: {
            Up: 'UP',
            Title: {
              Version: '版本：{{version}}',
              GenshinImpactCharacter2: '$t(Business.GenshinImpact.Gacha.Category.Character)-2',
            },
          },
          Toolbar: {
            Account: {
              Title: '账号',
              Available: '可用',
              NoAvailable: '无账号',
              AddNewAccount: '添加新的账号',
              Options: {
                Title: '更多选项',
                Edit: '编辑账号',
                ChooseAvatar: '修改头像',
                Delete: '删除账号',
              },
              DeleteAccountDialog: {
                Title: '确认删除账号：$t(Business.{{keyofBusinesses}}.Name)',
                Uid: 'UID：',
                DisplayName: '显示名称：',
                Whole: '完整删除：',
                WholeInformation: '敬告！启用后，这将删除此账号以及抽卡记录数据。',
                CancelBtn: '取消',
                SubmitBtn: '删除',
              },
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
              ManualInputDialog: {
                Title: '手动输入链接：',
                Placeholder: '带有完整参数的 URL 抽卡链接：\n{{example}}',
                Required: '请输入 URL 抽卡链接。',
                Validate: '请输入有效的 URL 抽卡链接格式。',
                CancelBtn: '取消',
                SubmitBtn: '确定',
              },
              Obtain: {
                Loading: '获取$t(Business.{{keyofBusinesses}}.Gacha.Name)链接...',
                Error: '获取$t(Business.{{keyofBusinesses}}.Gacha.Name)链接失败：',
              },
              Fetch: {
                Loading: '拉取$t(Business.{{keyofBusinesses}}.Gacha.Name)记录...',
                Success: {
                  Title: '拉取$t(Business.{{keyofBusinesses}}.Gacha.Name)记录成功：',
                  AddedBody: '新增 {{changes}} 条新记录。',
                  DeletedBody: '移除 {{changes}} 条不正确记录。',
                },
                Error: '拉取$t(Business.{{keyofBusinesses}}.Gacha.Name)记录失败：',
                Fragment: {
                  Idle: '空闲中...',
                  Sleeping: '等待中...',
                  Ready: '准备拉取记录：$t(Business.{{keyofBusinesses}}.Gacha.Category.{{value}})',
                  Pagination: '拉取第 {{value}} 页记录...',
                  Data: '拉取到 {{value}} 条新记录。',
                  Completed: '完成拉取记录：$t(Business.{{keyofBusinesses}}.Gacha.Category.{{value}})',
                  Finished: '全部完成。',
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
          ChooseAvatarDialog: {
            Title: '修改头像：{{identify}}',
            Confirm: '使用',
            Success: '成功修改头像。',
          },
          UpsertAccountDialog: {
            AddTitle: '添加新账号：$t(Business.{{keyofBusinesses}}.Name)',
            AddSuccess: '成功添加新账号：{{uid}}',
            EditTitle: '编辑账号：$t(Business.{{keyofBusinesses}}.Name)',
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
                Info: '统一可交换抽卡记录标准 (UIGF) v4.0, v4.1',
              },
              LegacyUigf: {
                Text: 'UIGF (Legacy)',
                Info: '统一可交换抽卡记录标准 (UIGF) v2.0, v2.1, v2.2, v2.3, v2.4, v3.0',
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
              UigfLocale: {
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
            ExportForm: {
              Folder: {
                Label: '目录',
                Placeholder: '待导出目录',
                SelectBtn: '选择...',
              },
              Format: {
                Label: '格式',
              },
              UigfVersion: {
                Label: '版本',
              },
              UigfMinimized: {
                Label: '最小化数据',
                Info: '启用最小化数据后，一些可选字段不再导出。',
                State_true: '启用',
                State_false: '禁用',
              },
              Pretty: {
                Label: '美化数据',
                Info: '启用后，数据将以易于阅读的格式输出。',
                State_true: '启用',
                State_false: '禁用',
              },
              CancelBtn: '取消',
              SubmitBtn: '导出',
              Success: {
                Title: '导出成功',
                Body: '文件保存至：{{output}}',
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
                  UpAverage: 'UP平均每金：{{count}}',
                  UpPercentage: 'UP出金率：{{count}}%',
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
            Analysis: {
              CardsEntry: {
                Labels: {
                  AverageAndUp: '平均 / UP',
                  UpWin: 'UP不歪',
                  Up: 'UP',
                  Count: '统计',
                },
              },
              CardsEntryRecord: {
                NextPity: '已垫',
                HardPity: '保底!',
                Up: 'UP',
              },
              Switcher: {
                Label: '使用旧版',
              },
              LegacyTable: {
                Title: '数据占比',
              },
              LegacyHistory: {
                Title: '$t(Business.{{keyofBusinesses}}.Gacha.Name)历史',
                Title_ZenlessZoneZero: '信号$t(Business.ZenlessZoneZero.Gacha.Name)历史',
                ListTitle_Up: '{{upSum}} UP',
                ListTitle_Total: '{{sum}} 总',
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
          Migration: {
            Title: '数据库迁移',
            Subtitle: '将旧版本 v0 的数据库迁移至此。',
            Migrate: {
              Btn: '迁移',
              Loading: {
                Title: '迁移中...',
                Body: '请勿退出应用程序并等待迁移操作完成。',
              },
              Success: {
                Title: '迁移成功:',
                Body: '账号数量：{{accounts}}，抽卡记录：{{gachaRecords}}',
              },
              Error: '迁移失败：',
            },
          },
          General: {
            Title: '常规',
            Language: {
              Title: '语言',
              Subtitle: '更改应用使用的主要语言。',
            },
            NavbarBusinessVisible: {
              Title: '导航栏业务项可见性',
              Subtitle: '控制导航栏中业务相关条目的显示与隐藏状态。',
            },
            GachaClientareaTab: {
              Title: '业务启动标签页',
              Subtitle: '选择您的默认业务客户区域的启动标签页。',
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
            Font: {
              Title: '界面字体',
              Subtitle: '更改应用中界面的字体。',
              None: '无',
            },
          },
          About: {
            Title: '关于',
            Updater: {
              Title: '应用更新',
              Subtitle: '检查应用的版本更新。',
              CheckBtn: '检查更新',
            },
            Specification: {
              Title: '设备规格',
              CopyBtn: '复制',
              OperatingSystem: '操作系统',
              SystemVersion: '系统版本',
              Webview2: 'Webview2',
              Tauri: 'Tauri',
              GitCommit: 'Git 提交',
              AppVersion: '应用版本',
            },
            Lnk: {
              Title: '快捷方式',
              Subtitle: '创建应用的桌面快捷方式。',
              CreateBtn: '创建',
              Loading: '创建快捷方式中...',
              Success: '创建成功。',
              Error: '创建失败：',
            },
          },
        },
      },
    },
  },
} as const
