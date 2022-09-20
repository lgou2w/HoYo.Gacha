# Genshin Gacha - CLI

用于 **`原神`** 祈愿的命令行工具。

## 可用功能

- [x] 获取祈愿链接。可知链接的创建日期、过期日期等信息。
- [x] 从此祈愿链接，获取最新的祈愿记录数据，并导出为 `JSON`（[UIGF](https://www.snapgenshin.com/development/UIGF.html)）和 `Excel` 格式文件。
- [ ] 更多功能开发中...

## 如何使用

首先下载 [最新版本](https://github.com/lgou2w/genshin-gacha/releases) 里的 `genshin-gacha-cli.exe` 工具。

### 1. 双击运行

该方式会获取祈愿链接并打印，然后获取最新的祈愿记录数据，并导出到当前程序运行目录。

### 2. 只获取祈愿链接

使用：`./genshin-gacha-cli.exe url --verbose`

> 只有当指定 --verbose 参数时才会输出详细信息。

```shell
祈愿链接:
创建日期（国际）：2022-09-20T05:25:33.009Z
创建日期（本地）：2022/09/20 13:25:33
过期时间（本地）：2022/09/21 13:25:33【创建时间 + 1 天】
是否已过期：false

https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog?win_mode=fullscreen&authkey_ver=1&sign_type=2&
auth_appid=webview_gacha&init_type=301&gacha_id=b4ac24d133739b7b1d55173f30ccf980e0b73fc1&timestamp=1661298571&lang=zh-cn&
device_type=pc&game_version=CNRELWin3.0.0_R10283122_S10446836_D10316937&plat_type=pc&region=cn_gf01&authkey=nI%2f3TVFfMBDUbcIWksQ......
```

### 3. 从祈愿链接获取最新的祈愿记录并导出到指定目录

使用：`./genshin-gacha-cli.exe logs --out ./your_out_dir`

> 需要指定 --out 参数为输出的目录文件夹。

```shell
获取祈愿记录中...
获取祈愿类型：301（角色活动祈愿）
...
获取祈愿类型：302（武器活动祈愿）
...
获取祈愿类型：200（常驻祈愿）
...
获取祈愿类型：100（新手祈愿）
...
导出记录中...
JSON（UIGF）："./your_out_dir/原神祈愿记录_UIGF_20220920_190707.json"
EXCEL："./your_out_dir/原神祈愿记录_EXCEL_20220920_190707.xlsx"
完成
```
