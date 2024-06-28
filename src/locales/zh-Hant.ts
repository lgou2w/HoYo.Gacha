export default {
  Business: {
    GenshinImpact: {
      Name: '原神',
      Player: '旅行者',
      Currency: '原石',
      Servers: {
        Official: '天空島',
        Channel: '世界樹',
        Oversea: {
          USA: '美服',
          Euro: '歐服',
          Asia: '亞服',
          Cht: '港澳台服'
        }
      },
      Gacha: {
        Name: '祈願'
      },
      GameDataDir: {
        Example: 'X:/Genshin Impact/Genshin Impact Game/GenshinImpact_Data'
      }
    },
    HonkaiStarRail: {
      Name: '崩壞：星穹鐵道',
      Player: '開拓者',
      Currency: '星琼',
      Servers: {
        Official: '星穹列車',
        Channel: '無名客',
        Oversea: {
          USA: '美服',
          Euro: '歐服',
          Asia: '亞服',
          Cht: '港澳台服'
        }
      },
      Gacha: {
        Name: '躍遷'
      },
      GameDataDir: {
        Example: 'X:/Star Rail/Game/StarRail_Data'
      }
    }
  },
  Error: {
    Database: {
      Title: '哎呀！發生意外嚴重的資料庫錯誤：',
      FormattingMessage: '發生意外嚴重的資料庫錯誤：{{message}} ({{code}})'
    },
    GachaBusiness: {
      Title: '哎呀！發生意外的業務錯誤：',
      FormattingMessage: '發生意外的業務錯誤：{{message}} ({{kind}})'
    },
    Unexpected: {
      Title: '發生意外錯誤：',
      FormattingMessage: '發生意外錯誤：{{message}}'
    }
  },
  Components: {
    Commons: {
      Navbar: {
        TabListRouter: {
          '/': '主頁',
          '/accounts': '賬戶',
          '/settings': '設定',
          '/gacha/GenshinImpact': '$t(Business.GenshinImpact.Name)',
          '/gacha/HonkaiStarRail': '$t(Business.HonkaiStarRail.Name)'
        }
      }
    }
  },
  ErrorPage: {
    Title: '哎呀！',
    Subtitle: '抱歉，發生意外錯誤。'
  },
  Pages: {
    Accounts: {
      Title: '帳戶管理',
      BusinessView: {
        AddOrEditForm: {
          CancelBtn: '取消',
          SubmitBtn: '確認',
          Valid: '有效。',
          SuccessAdded: '創建帳戶 {{uid}} 成功。',
          SuccessEdited: '編輯帳戶 {{uid}} 成功。',
          Uid: {
            Label: 'UID',
            Placeholder: '遊戲內帳戶的 UID（9 比特數位）',
            Required: '請輸入 UID 欄位值。',
            Pattern: '請輸入正確的 UID 格式。',
            AlreadyExists: '該帳戶 UID 已經存在。'
          },
          DisplayName: {
            Label: '顯示名稱',
            Placeholder: '帳戶的顯示名稱（僅用於識別）',
            Length: '超過最大字元長度限制。'
          },
          GameDataDir: {
            Label: '遊戲數據目錄',
            Placeholder: '遊戲數據目錄的完整路徑。\n例如：$t(Business.{{business}}.GameDataDir.Example)',
            Required: '請設定遊戲數據目錄。',
            AutoFindBtn: '自動查找',
            ManualFindBtn: '手動選擇',
            ManualFindTitle: '請手動選擇遊戲數據目錄：',
            EmptyFind: '未找到有效的遊戲數據目錄。 請檢查遊戲是否安裝並運行。'
          }
        },
        AddOrEditDialog: {
          AddTitle: '添加新帳戶：$t(Business.{{business}}.Name)',
          EditTitle: '編輯帳戶：$t(Business.{{business}}.Name)'
        },
        Toolbar: {
          Title: '$t(Business.{{business}}.Name)',
          AddAccountBtn: '添加帳戶'
        },
        List: {
          Empty: '尚未添加任何帳戶。'
        },
        ListItem: {
          EditAccountBtn: '編輯帳戶',
          Server: '服務器：$t(Business.{{business}}.Servers.{{path}})'
        }
      }
    },
    Gacha: {
      BusinessView: {
        AccountSelect: {
          Empty: '無帳戶'
        }
      }
    },
    Settings: {
      Title: '設定',
      General: {
        Title: '常規',
        Language: {
          Title: '語言',
          Subtitle: '更改應用使用的主要語言。',
          'en-US': '英語 (US)',
          'zh-Hans': '簡體中文',
          'zh-Hant': '繁體中文'
        }
      },
      Appearance: {
        Title: '外觀',
        ThemeSpace: {
          Title: '主題顏色',
          Subtitle: '更改應用中顯示的主要顏色。'
        },
        ThemeColor: {
          Title: '偏好配色方案',
          Subtitle: '切換應用使用淺色主題或暗色主題。',
          Light: '淺色',
          Dark: '暗色'
        },
        ThemeZoom: {
          Title: '介面縮放',
          Subtitle: '更改應用中介面的縮放比例。'
        }
      },
      About: {
        Title: '關於',
        Update: {
          Title: '應用更新',
          Subtitle: '檢查應用的版本更新。',
          CheckBtn: '檢查更新',
          Channel: {
            Stable: '穩定版 (Stable)',
            Insider: '預覽版 (Insider)'
          }
        }
      }
    }
  }
}
