/* eslint-disable camelcase */

export default {
  language: 'zh-Hant',
  matches: ['zh-HK', 'zh-TW', 'zh-MO'],
  constants: {
    text: '繁體中文',
    dayjs: 'zh-tw',
    gacha: 'zh-tw',
  },
  translation: {
    Business: {
      GenshinImpact: {
        Name: '原神',
        Player: {
          Name: '旅行者',
          Girl: '熒',
          Boy: '空',
        },
        Currency: {
          Name01: '原石',
          Name02: '創世結晶',
        },
        Gacha: {
          Name: '祈願',
          Ticket01: '相遇之緣',
          Ticket02: '糾纏之緣',
          Category: {
            Beginner: '新手祈願',
            Beginner_Title: '初行者推薦祈願',
            Permanent: '常駐祈願',
            Permanent_Title: '奔行世間',
            Character: '角色活動祈願',
            Weapon: '武器活動祈願',
            Weapon_Title: '神鑄賦形',
            Chronicled: '集錄祈願',
            Aggregated: '總計',
          },
        },
        DataFolder: {
          Example: 'X:/Genshin Impact/Genshin Impact Game/YuanShen_Data',
        },
      },
      HonkaiStarRail: {
        Name: '崩壞：星穹鐵道',
        Player: {
          Name: '開拓者',
          Girl: '星',
          Boy: '穹',
        },
        Currency: {
          Name01: '星瓊',
          Name02: '古老夢華',
        },
        Gacha: {
          Name: '躍遷',
          Ticket01: '星軌通票',
          Ticket02: '星軌專票',
          Category: {
            Beginner: '新手躍遷',
            Beginner_Title: '始發躍遷',
            Permanent: '常駐躍遷',
            Permanent_Title: '群星躍遷',
            Character: '角色活動躍遷',
            Weapon: '光錐活動躍遷',
            CollaborationCharacter: '角色聯動躍遷',
            CollaborationWeapon: '光錐聯動躍遷',
            Aggregated: '總計',
          },
        },
        DataFolder: {
          Example: 'X:/Star Rail/Game/StarRail_Data',
        },
      },
      ZenlessZoneZero: {
        Name: '絕區零',
        Player: {
          Name: '繩匠',
          Girl: '鈴',
          Boy: '哲',
        },
        Currency: {
          Name01: '菲林',
          Name02: '菲林底片',
        },
        Gacha: {
          Name: '調頻',
          Ticket01: '原裝母帶',
          Ticket02: '加密母帶',
          Ticket03: '邦布券',
          Category: {
            Permanent: '常駐頻道',
            Permanent_Title: '熱門卡司',
            Character: '獨家頻道',
            Weapon: '音擎頻道',
            Bangboo: '邦布頻道',
            Bangboo_Title: '卓越搭檔',
            Aggregated: '總計',
            Aggregated_NoBangboo: '(不含邦布頻道)',
          },
        },
        DataFolder: {
          Example: 'X:/ZenlessZoneZero Game/ZenlessZoneZero_Data',
        },
      },
    },
    Errors: {
      Unexpected: '發生意外錯誤：{{message}}',
      SqlxError: '發生 sqlx 錯誤：{{message}}',
      SqlxDatabaseError: '發生 sqlx 資料庫錯誤：{{message}}',
      DataFolderError: {
        Invalid: '無效的遊戲資料目錄。',
        UnityLogFileNotFound: 'Unity 日誌檔案不存在：{{path}}',
        OpenUnityLogFile: '開啟 Unity 日誌檔案時錯誤：{{cause.message}}：{{path}}',
        Vacant: '空缺的遊戲資料目錄。',
      },
      GachaUrlError: {
        WebCachesNotFound: '網頁快取路徑不存在：{{path}}',
        OpenWebCaches: '開啟網頁快取時錯誤：{{cause.message}}：{{path}}',
        ReadDiskCache: '讀取硬碟快取時錯誤：{{cause.message}}：{{path}}',
        EmptyData: '抽卡連結返回空資料。最新資料會有延遲，請稍後重試！',
        NotFound: '未找到有效的抽卡連結。請嘗試在遊戲內開啟歷史記錄介面！',
        Illegal: '非法的抽卡連結：{{url}}',
        IllegalGameBiz: '非法的抽卡連結 GameBiz 參數：{{value}}',
        InvalidParams: '無效的抽卡連結參數：{{params}}',
        Reqwest: '請求抽卡連結時錯誤：{{cause}}',
        AuthkeyTimeout: '抽卡連結已經過期失效。請重新在遊戲內開啟抽卡歷史記錄介面！',
        VisitTooFrequently: '抽卡連結存取過於頻繁。請稍後重試！',
        UnexpectedResponse: '抽卡連結返回了意外響應：{{message}} (返回碼：{{retcode}})',
        MissingMetadataEntry: '缺失元資料條目：{{business}}，語言：{{locale}}，名稱：{{name}}',
        InconsistentUid: '抽卡連結的擁有者 UID 不匹配：{{actuals}} (預期：{{expected}})',
      },
      LegacyUigfGachaRecordsWriteError: {
        InvalidUid: '無效的業務 UID：{{uid}}',
        IncompatibleRecordBusiness: '不相容的記錄業務：{{business}}，ID：{{id}}，名稱：{{name}}，游標：{{cursor}}',
        IncompatibleRecordOwner: '不相容的記錄所有者：預期：{{expected}}，實際：{{actual}}，游標：{{cursor}}',
        IncompatibleRecordLocale: '不相容的記錄語言：預期：{{expected}}，實際：{{actual}}，游標：{{cursor}}',
        FailedMappingGachaType: '映射 UIGF 的 GachaType 失敗：{{value}}，游標：{{cursor}}',
        CreateOutput: '建立輸出失敗：{{cause.message}}：{{path}}',
        Serialize: '序列化 JSON 錯誤：{{cause}}',
      },
      LegacyUigfGachaRecordsReadError: {
        OpenInput: '開啟輸入失敗：{{cause.message}}：{{path}}',
        InvalidInput: '無效的 JSON 輸入：{{cause}}',
        InvalidVersion: '無效的 UIGF 版本字串：{{version}}',
        UnsupportedVersion: '不支援的 UIGF 版本：{{version}} (允許的：{{allowed}})',
        InconsistentUid: '與預期 UID 不一致：預期：{{expected}}，實際：{{actual}}，游標：{{cursor}}',
        InvalidUid: '無效的業務 UID：{{uid}}',
        InvalidRegionTimeZone: '無效的區域時區：{{value}}',
        RequiredField: '缺失必選欄位：{{field}}，游標：{{cursor}}',
        MissingMetadataLocale: '缺失元資料語言：{{locale}}，游標：{{cursor}}',
        MissingMetadataEntry: '缺失元資料條目：語言：{{locale}}，{{key}}：{{val}}，游標：{{cursor}}',
      },
      UigfGachaRecordsWriteError: {
        VacantAccount: '沒有提供帳號資訊：{{business}}，UID：{{uid}}',
        InvalidUid: '無效的業務 UID：{{business}}，UID：{{uid}}',
        MissingMetadataEntry: '缺失元資料條目：{{business}}，語言：{{locale}}，{{key}}：{{val}}，游標：{{cursor}}',
        FailedMappingGachaType: '映射 UIGF 的 GachaType 失敗：{{value}}，游標：{{cursor}}',
        CreateOutput: '建立輸出失敗：{{cause.message}}：{{path}}',
        Serialize: '序列化 JSON 錯誤：{{cause}}',
      },
      UigfGachaRecordsReadError: {
        OpenInput: '開啟輸入失敗：{{cause.message}}：{{path}}',
        InvalidInput: '無效的 JSON 輸入：{{cause}}',
        InvalidVersion: '無效的 UIGF 版本字串：{{version}}',
        UnsupportedVersion: '不支援的 UIGF 版本：{{version}} (允許的：{{allowed}})',
        InvalidUid: '無效的業務 UID：{{business}}，UID：{{uid}}',
        InvalidRegionTimeZone: '無效的區域時區：{{business}}，時區：{{value}}',
        MissingMetadataEntry: '缺失元資料條目：{{business}}，語言：{{locale}}，{{key}}：{{val}}，游標：{{cursor}}',
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
        MissingMetadataEntry: '$t(Errors.LegacyUigfGachaRecordsReadError.MissingMetadataEntry)',
      },
      PrettyGachaRecordsError: {
        MissingMetadataEntry: '缺失元資料條目：{{business}}，語言：{{locale}}，名稱：{{name}}，物品 ID：{{itemId}}',
      },
      LegacyMigrationError: {
        NotFound: '舊資料庫不存在。',
        SamePath: '舊資料庫路徑不能與當前資料庫路徑相同。',
        Sqlx: '發生 sqlx 錯誤：{{cause}}',
        ParseInt: '無法解析整數：{{cause}}',
        SerdeJson: '序列化 JSON 錯誤：{{cause}}',
        InvalidUid: '無法偵測 UID 的業務區域：{{uid}} ({{business}})',
        MissingMetadataLocale: '缺失元資料語言：{{business}}，語言：{{locale}}',
        MissingMetadataEntry: '缺失元資料條目：{{business}}，語言：{{locale}}，{{key}}：{{val}}',
      },
    },
    Routes: {
      '/': '主頁',
      '/Settings': '設定',
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
              Title: '帳號',
              Available: '可用',
              NoAvailable: '無帳號',
              AddNewAccount: '新增帳號',
              Options: {
                Title: '更多選項',
                Edit: '編輯帳號',
                Delete: '刪除帳號',
              },
              DeleteAccountDialog: {
                Title: '確認刪除帳號：$t(Business.{{keyofBusinesses}}.Name)',
                Uid: 'UID：',
                DisplayName: '顯示名稱：',
                Whole: '完整刪除：',
                WholeInformation: '敬告！啟用後，這將刪除此帳號以及抽卡記錄資料。',
                CancelBtn: '取消',
                SubmitBtn: '刪除',
              },
            },
            Url: {
              Title: '$t(Business.{{keyofBusinesses}}.Gacha.Name)連結',
              Deadline: '(有效期 {{deadline}})',
              Expired: '(已失效)',
              Input: {
                Placeholder: '$t(Business.{{keyofBusinesses}}.Gacha.Name)連結',
              },
              CopyBtn: '複製',
              UpdateBtn: '更新',
              More: '更多操作',
              FullUpdateBtn: '全量更新',
              ManualInputBtn: '手動輸入連結',
              ManualInputDialog: {
                Title: '手動輸入連結：',
                Placeholder: '帶有完整參數的 URL 抽卡連結：\n{{example}}',
                Required: '請輸入 URL 抽卡連結。',
                Validate: '請輸入有效的 URL 抽卡連結格式。',
                CancelBtn: '取消',
                SubmitBtn: '確定',
              },
              Obtain: {
                Loading: '取得$t(Business.{{keyofBusinesses}}.Gacha.Name)連結中...',
                Error: '取得$t(Business.{{keyofBusinesses}}.Gacha.Name)連結失敗：',
              },
              Fetch: {
                Loading: '拉取$t(Business.{{keyofBusinesses}}.Gacha.Name)記錄中...',
                Success: {
                  Title: '拉取$t(Business.{{keyofBusinesses}}.Gacha.Name)記錄成功：',
                  AddedBody: '新增 {{changes}} 條新記錄。',
                  DeletedBody: '移除 {{changes}} 條不正確記錄。',
                },
                Error: '拉取$t(Business.{{keyofBusinesses}}.Gacha.Name)記錄失敗：',
                Fragment: {
                  Idle: '閒置中...',
                  Sleeping: '等待中...',
                  Ready: '準備拉取記錄：$t(Business.{{keyofBusinesses}}.Gacha.Category.{{value}})',
                  Pagination: '拉取第 {{value}} 頁記錄...',
                  Data: '拉取到 {{value}} 條新記錄。',
                  Completed: '完成拉取記錄：$t(Business.{{keyofBusinesses}}.Gacha.Category.{{value}})',
                  Finished: '全部完成。',
                },
              },
            },
            Tabs: {
              Title: '標籤頁',
              Overview: '概覽',
              Analysis: '分析',
              Chart: '統計',
            },
            Convert: {
              Import: {
                Title: '匯入',
              },
              Export: {
                Title: '匯出',
              },
            },
          },
          UpsertAccountForm: {
            CancelBtn: '取消',
            SubmitBtn: '確定',
            Valid: '有效。',
            Uid: {
              Label: 'UID',
              Placeholder: '遊戲內帳號的 UID',
              Required: '請輸入 UID 欄位值。',
              Pattern: '請輸入正確的 UID 格式。',
              AlreadyExists: '該帳號 UID 已經存在。',
            },
            DisplayName: {
              Label: '顯示名稱',
              Placeholder: '帳號的顯示名稱（選填，僅用於識別）',
              Length: '超過最大字元長度限制。',
            },
            DataFolder: {
              Label: '遊戲資料目錄',
              Placeholder: '遊戲資料目錄的完整路徑。\n例如："$t(Business.{{keyofBusinesses}}.DataFolder.Example)"',
              Required: '請設定遊戲資料目錄。',
              AutoFindBtn: '自動查找',
              ManualFindBtn: '手動選擇',
              ManualFindTitle: '請選擇$t(Business.{{keyofBusinesses}}.Name)的遊戲資料目錄',
              EmptyFind: '未找到有效的遊戲資料目錄。請檢查遊戲是否安裝並執行。',
            },
          },
          UpsertAccountDialog: {
            AddTitle: '新增帳號：$t(Business.{{keyofBusinesses}}.Name)',
            AddSuccess: '成功新增帳號：{{uid}}',
            EditTitle: '編輯帳號：$t(Business.{{keyofBusinesses}}.Name)',
            EditSuccess: '成功編輯帳號：{{uid}}',
          },
          DataConvert: {
            Dialog: {
              ImportTitle: '匯入$t(Business.{{keyofBusinesses}}.Gacha.Name)記錄',
              ExportTitle: '匯出$t(Business.{{keyofBusinesses}}.Gacha.Name)記錄',
            },
            Format: {
              Uigf: {
                Text: 'UIGF',
                Info: '統一可交換抽卡記錄標準 (UIGF) v4.0',
              },
              LegacyUigf: {
                Text: 'UIGF (Legacy)',
                Info: '統一可交換抽卡記錄標準 (UIGF) v2.2, v2.3, v2.4, v3.0',
              },
              Srgf: {
                Text: 'SRGF',
                Info: '星穹鐵道抽卡記錄標準 (SRGF) v1.0',
              },
            },
            ImportForm: {
              File: {
                Label: '檔案',
                Placeholder: '待匯入檔案',
                SelectBtn: '選擇...',
              },
              Format: {
                Label: '格式',
              },
              UigfLocale: {
                Label: '語言',
                Info: '匯入檔案格式的預期語言區域。',
              },
              SaveOnConflict: {
                Label: '衝突處理',
                Values: {
                  Nothing: '忽略',
                  Update: '更新',
                },
              },
              CancelBtn: '取消',
              SubmitBtn: '匯入',
              Success: {
                Title: '匯入成功',
                Body: '新增 {{changes}} 條新記錄。',
              },
            },
            ExportForm: {
              Folder: {
                Label: '目錄',
                Placeholder: '待匯出目錄',
                SelectBtn: '選擇...',
              },
              Format: {
                Label: '格式',
              },
              LegacyUigfVersion: {
                Label: '版本',
              },
              UigfMinimized: {
                Label: '最小化資料',
                Info: '啟用最小化資料後，部分選填欄位將不再匯出。',
                State_true: '啟用',
                State_false: '停用',
              },
              CancelBtn: '取消',
              SubmitBtn: '匯出',
              Success: {
                Title: '匯出成功',
                Body: '檔案儲存至：{{output}}',
              },
            },
          },
          Clientarea: {
            Overview: {
              GridCard: {
                Labels: {
                  Total: '共 {{count, number}} 抽',
                  GoldenSum: '已出 {{count, number}} 金',
                  NextPity: '已墊 {{count}} 抽',
                  Beginner: '新手：{{name}}',
                  Average: '平均每金：{{count}}',
                  Percentage: '出金率：{{count}}%',
                  LimitedAverage: '限定平均每金：{{count}}',
                  LimitedPercentage: '限定出金率：{{count}}%',
                  LastGolden: '最近出金：{{name}} ({{usedPity}})',
                  LastGoldenNone: '最近出金：無',
                },
              },
              LastUpdated: {
                Title: '最近$t(Business.{{keyofBusinesses}}.Gacha.Name)記錄更新日期：',
              },
              Tooltips: {
                Fragment1: {
                  Token1: '總計$t(Business.{{keyofBusinesses}}.Gacha.Name) ',
                  Token2: '{{total, number}}',
                  Token3: ' 次，總價值：',
                  Token4: '{{value, number}}',
                },
                Fragment2: '$t(Business.{{keyofBusinesses}}.Gacha.Name)記錄日期涵蓋範圍：',
                Fragment3: '因官方設定，最新資料存在約一小時延遲。如遇新卡池高峰期延遲可能更久。具體時間請以遊戲內資料為準。',
              },
            },
            Analysis: {
              CardsEntry: {
                Labels: {
                  AverageAndLimited: '平均 / 限定',
                  Limited: '限定',
                  Count: '統計',
                },
              },
              CardsEntryRecord: {
                NextPity: '已墊',
                HardPity: '保底!',
                Limited: 'UP',
              },
            },
          },
        },
      },
      Settings: {
        Hero: {
          OfficialBtn: '官方網站',
          FeedbackBtn: '問題回報',
          LicenseNote: '僅供個人學習交流使用。請勿用於任何商業或違法用途。',
        },
        Options: {
          Migration: {
            Title: '資料庫遷移',
            Subtitle: '將舊版 v0 的資料庫遷移至此。',
            Migrate: {
              Btn: '遷移',
              Loading: {
                Title: '遷移中...',
                Body: '請勿關閉應用程式並等待遷移操作完成。',
              },
              Success: {
                Title: '遷移成功：',
                Body: '帳號數量：{{accounts}}，抽卡記錄：{{gachaRecords}}',
              },
              Error: '遷移失敗：',
            },
          },
          General: {
            Title: '常規',
            Language: {
              Title: '語言',
              Subtitle: '變更應用程式的主要語言。',
            },
          },
          Appearance: {
            Title: '外觀',
            Namespace: {
              Title: '主題色彩',
              Subtitle: '變更應用程式顯示的主要顏色。',
            },
            ColorScheme: {
              Title: '偏好配色方案',
              Subtitle: '切換應用程式使用淺色主題或深色主題。',
              Light: '淺色',
              Dark: '深色',
            },
            ScaleLevel: {
              Title: '介面縮放',
              Subtitle: '變更應用程式介面的縮放等級。',
            },
          },
          About: {
            Title: '關於',
            Updater: {
              Title: '應用程式更新',
              Subtitle: '檢查應用程式的版本更新。',
              CheckBtn: '檢查更新',
              Channel: {
                Stable: '穩定版 (Stable)',
                Insider: '預覽版 (Insider)',
              },
            },
            Specification: {
              Title: '裝置規格',
              CopyBtn: '複製',
              OperatingSystem: '作業系統',
              SystemVersion: '系統版本',
              Webview2: 'Webview2',
              Tauri: 'Tauri',
              GitCommit: 'Git 提交',
              AppVersion: '應用版本',
            },
          },
        },
      },
    },
  },
} as const
