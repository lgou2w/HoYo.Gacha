# HoYo.Gacha

[![Actions](https://img.shields.io/github/actions/workflow/status/lgou2w/HoYo.Gacha/build.yml?branch=v1&logo=github&style=flat-square)](https://github.com/lgou2w/HoYo.Gacha/actions)
[![Releases](https://img.shields.io/github/v/release/lgou2w/HoYo.Gacha?logo=github&style=flat-square&include_prereleases)](https://github.com/lgou2w/HoYo.Gacha/releases)

一个非官方的工具，用于管理和分析你的 miHoYo 抽卡记录。

**无需任何本地代理服务器**。只需读取 `Chromium` [硬盘缓存](docs/DiskCache.md)文件并请求 API 端点。

An unofficial tool for managing and analyzing your miHoYo gacha records.

**No need for any local proxy server**. Just read the `Chromium` [disk cache](docs/DiskCache.md) file and request the API endpoint.

![Logo](src-tauri/icons/128x128.png)

> [!WARNING]
> **工作中** - 此分支用于未来的 `v1.0.0` 版本。
>
> **Work In Process** - This branch is for future `v1.0.0` release.

## 功能 / Features

- [x] 支持 `原神 Genshin Impact`、`崩坏：星穹铁道 Honkai: Star Rail` 和 `绝区零 Zenless Zone Zero`.
- [x] 支持游戏的多个账号。获取游戏的抽卡链接。 Support multiple accounts for the game. Get the gacha url.
- [x] 支持获取抽卡数据并保存到本地数据库。 Support fetch gacha data and saving it to the local database.
- [x] 支持导入或导出的数据交换文件格式。 Support data exchange file formats for import or export.
  - [x] [`UIGF`](https://uigf.org/zh/standards/uigf.html) 统一可交换抽卡记录标准：v2.0, v2.1, v2.2, v2.3, v2.4, v3.0, v4.0
  - [x] [`SRGF`](https://uigf.org/zh/standards/srgf.html) 星穹铁道抽卡记录标准：v1.0
  - [ ] `CSV` 逗号分隔文件格式。
  - [ ] `XLSX` Excel 表格文件格式。
  - [ ] [`zzz.rng.moe`](https://zzz.rng.moe) 绝区零工具箱。

## 重要变化 / Important changes

- 应用标识符 (App Identifier): `com.lgou2w.hoyo.gacha` -> `com.lgou2w.hoyo.gacha.v1`。
- 数据库文件 (Database File ): `HoYo.Gacha.db`         -> `HoYo.Gacha.v1.db`。

## 下载 / Download

请在此仓库 [Releases](https://github.com/lgou2w/HoYo.Gacha/releases) 下载最新版。

Please download the latest version from this repository [Releases](https://github.com/lgou2w/HoYo.Gacha/releases).

### 注意 / Notice

程序会在 `运行目录` 自动创建名为 `HoYo.Gacha.v1.db` 的数据库文件。此文件中包含了 `您的所有本地账号` 和 `全部的抽卡记录` 数据。请确保在 `移动程序本体文件` 或 `迁移操作系统` 时不要遗漏此数据库文件！

The program will automatically create a database file named `HoYo.Gacha.v1.db` in the `Run Directory`. This file contains `all your local accounts` and `all gacha records` data. Please make sure not to miss this database file when `moving the program` or `migrating the operating system`!

## 迁移 / Migration

### 从 v0 迁移 / Migrating from v0

打开新版本工具应用。点击应用左下角齿轮状的 `设置` 按钮，找到顶部的 `数据库迁移` 栏，点击右侧的 `迁移` 按钮。选择并打开旧版本数据库 `HoYo.Gacha.db` 文件，等待迁移自动完成。

Open the new version of the tool app. Click the gear-shaped `Settings` button in the lower left corner of the app, find the `Database Migration` bar at the top, and click the `Migrate` button on the right. Select and open the old version database `HoYo.Gacha.db` file and wait for the migration to complete automatically.

## 协议 / License

> [!NOTE]
> MIT OR Apache-2.0 | **仅供个人学习交流使用。请勿用于任何商业或违法违规用途。**
>
> **本软件不会向您索要任何关于 ©miHoYo 账户的账号密码信息，也不会收集任何用户数据。** 所产生的数据（包括但不限于使用数据、抽卡数据、UID 信息等）均保存在用户本地。
>
> MIT OR Apache-2.0 | **For personal study and communication use only. Please do not use it for any commercial or illegal purposes.**
>
> **This software will not ask you for any account password information about ©miHoYo account, nor will it collect any user data.** The generated data (including but not limited to usage data, Gacha data, UID information, etc.) are all stored locally by the user.

## 部分资源 / Some assets

©miHoYo | 上海米哈游影铁科技有限公司 版权所有

- [public/Logo.avif](public/Logo.avif)
- [src/assets/images/GenshinImpact/*](src/assets/images/GenshinImpact)
- [src/assets/images/HonkaiStarRail/*](src/assets/images/HonkaiStarRail)
- [src/assets/images/ZenlessZoneZero/*](src/assets/images/ZenlessZoneZero)
- [src-tauri/icons/*](src-tauri/icons/)
