export default {
  common: {
    business: {
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
        },
        gameDataDir: {
          example: 'X:/Genshin Impact/Genshin Impact Game/GenshinImpact_Data'
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
        },
        gameDataDir: {
          example: 'X:/Star Rail/Game/StarRail_Data'
        }
      }
    }
  },
  error: {
    database: {
      title: '哎呀！發生意外嚴重的資料庫錯誤：',
      formattingMessage: '發生意外嚴重的資料庫錯誤：{{message}} ({{code}})'
    },
    gachaBusiness: {
      title: '哎呀！發生意外的 GachaBusiness 錯誤：',
      formattingMessage: '發生意外的 GachaBusiness 錯誤：{{message}} ({{kind}})'
    },
    unexpected: {
      title: '發生意外錯誤：',
      formattingMessage: '發生意外錯誤：{{message}}'
    }
  },
  errorPage: {
    title: '哎呀！',
    subtitle: '抱歉，發生意外錯誤。'
  },
  components: {
    core: {
      navbar: {
        tabListRouter: {
          '/': '主頁',
          '/accounts': '賬戶',
          '/settings': '設定',
          '/gacha/GenshinImpact': '$t(common.business.GenshinImpact.name)',
          '/gacha/HonkaiStarRail': '$t(common.business.HonkaiStarRail.name)'
        }
      }
    },
    accounts: {
      title: '帳戶管理',
      businessView: {
        addOrEditForm: {
          cancelBtn: '取消',
          submitBtn: '確認',
          valid: '有效。',
          successAdded: '創建帳戶 {{uid}} 成功。',
          successEdited: '編輯帳戶 {{uid}} 成功。',
          uid: {
            label: 'UID',
            placeholder: '遊戲內帳戶的 UID（9 比特數位）',
            required: '請輸入 UID 欄位值。',
            pattern: '請輸入正確的 UID 格式。',
            alreadyExists: '該帳戶 UID 已經存在。'
          },
          displayName: {
            label: '顯示名稱',
            placeholder: '帳戶的顯示名稱（僅用於識別）',
            length: '超過最大字元長度限制。'
          },
          gameDataDir: {
            label: '遊戲數據目錄',
            placeholder: '遊戲數據目錄的完整路徑。\n例如：$t(common.business.{{business}}.gameDataDir.example)',
            required: '請設定遊戲數據目錄。',
            autoFindBtn: '自動查找',
            manualFindBtn: '手動選擇',
            manualFindTitle: '請手動選擇遊戲數據目錄：',
            emptyFind: '未找到有效的遊戲數據目錄。 請檢查遊戲是否安裝並運行。'
          }
        },
        addOrEditDialog: {
          addTitle: '添加新帳戶：$t(common.business.{{business}}.name)',
          editTitle: '編輯帳戶：$t(common.business.{{business}}.name)'
        },
        toolbar: {
          title: '$t(common.business.{{business}}.name)',
          addAccountBtn: '添加帳戶'
        },
        list: {
          empty: '尚未添加任何帳戶。'
        },
        listItem: {
          editAccountBtn: '編輯帳戶',
          server: '服務器：$t(common.business.{{business}}.servers.{{path}})'
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
