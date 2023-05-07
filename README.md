# HoYo.Gacha

<p>
<a href="https://github.com/lgou2w/HoYo.Gacha/actions"><img src="https://img.shields.io/github/actions/workflow/status/lgou2w/HoYo.Gacha/build.yml?branch=main&logo=github&style=flat-square"/></a>
<a href="https://github.com/lgou2w/HoYo.Gacha/releases"><img src="https://img.shields.io/github/v/release/lgou2w/HoYo.Gacha?logo=github&style=flat-square" /></a>
</p>

一个非官方的工具，用于管理和分析你的 miHoYo 抽卡记录。

**无需任何本地代理服务器**。只需读取 `Chromium` [硬盘缓存](DiskCache/README.md)文件并请求 API 端点。

<br />
<img src="src-tauri/icons/icon.png" style="width:256px;" />

## 功能

> 正在开发和重构中...

- [ ] 支持 **`原神`** 和 **`崩坏：星穹铁道`** 游戏抽卡记录。
- [ ] 支持管理游戏的多个账号。
- [ ] 获取游戏的抽卡链接。更新记录并保存到本地数据库。
- [ ] 实现 `UIGF` 统一可交换祈愿记录标准。
- [ ] 开发中...

## 硬盘缓存

**关于从 `Chromium Disk Cache` 硬盘缓存获取祈愿链接的实现原理请参考：[硬盘缓存](DiskCache/README.md)**

## 特别感谢

* [UIGF organization](https://uigf.org)
* [EnkaNetwork](https://github.com/EnkaNetwork)
* [DGP-Studio/Snap.Hutao](https://github.com/DGP-Studio/Snap.Hutao)
* [YuehaiTeam/cocogoat](https://github.com/YuehaiTeam/cocogoat)
* [vikiboss/gs-helper](https://github.com/vikiboss/gs-helper)

## 协议

MIT OR Apache-2.0 **仅供个人学习交流使用。请勿用于任何商业或违法违规用途。**

### 部分资源文件

[个人非商用授权](https://www.hanyi.com.cn/faq-doc-1) - 北京汉仪创新科技股份有限公司 版权所有

* [src/assets/汉仪文黑-85W.ttf](src/assets/%E6%B1%89%E4%BB%AA%E6%96%87%E9%BB%91-85W.ttf)

©miHoYo | 上海米哈游影铁科技有限公司 版权所有

* [src/assets/images/Logo.png](src/assets/images/Logo.png)
* [src/assets/images/genshin](src/assets/images/genshin)
* [src/assets/images/starrail](src/assets/images/starrail)
* [src-tauri/icons/*](src-tauri/icons/)
