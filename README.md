# HoYo.Gacha

<p>
<a href="https://github.com/lgou2w/HoYo.Gacha/actions"><img src="https://img.shields.io/github/actions/workflow/status/lgou2w/HoYo.Gacha/build.yml?branch=main&logo=github&style=flat-square"/></a>
<a href="https://github.com/lgou2w/HoYo.Gacha/releases"><img src="https://img.shields.io/github/v/release/lgou2w/HoYo.Gacha?logo=github&style=flat-square&include_prereleases" /></a>
</p>

一个非官方的工具，用于管理和分析你的 miHoYo 抽卡记录。

**无需任何本地代理服务器**。只需读取 `Chromium` [硬盘缓存](DiskCache/README.md)文件并请求 API 端点。

<br />
<img src="src-tauri/icons/icon.png" style="width:256px;" />

> [!IMPORTANT]
> 全新版本 v1.0.0 正在重构制作中。查看问题追踪：[#28](https://github.com/lgou2w/HoYo.Gacha/issues/28)
>
> The new version v1.0.0 is being refactored. View Issue Tracker: [#28](https://github.com/lgou2w/HoYo.Gacha/issues/28)
>
>  <a href="https://github.com/lgou2w/HoYo.Gacha/tree/v1"><img src="https://img.shields.io/github/last-commit/lgou2w/HoYo.Gacha/v1?style=flat-square&logo=github"/></a>

## 功能

- [x] 支持 **`原神`**、**`崩坏：星穹铁道`** 和 **`绝区零`** 游戏抽卡记录。
- [x] 管理游戏的多个账号。
- [x] 获取游戏的抽卡链接。
- [x] 获取抽卡记录并保存到本地数据库文件。
- [x] 实现 [`UIGF`](https://uigf.org/zh/standards/uigf.html) 统一可交换祈愿记录标准。
- [x] 实现 [`SRGF`](https://uigf.org/zh/standards/srgf.html) 星穹铁道抽卡记录标准。
- [ ] 更多开发中...

<details>
  <summary>软件截图</summary>
  <br />

  * 主页

  ![Home](Screenshots/home.jpg)

  * 原神 - Genshin Impact

  ![Gacha-Genshin-1](Screenshots/gacha-genshin-1.jpg)

  * 崩坏：星穹铁道 - Honkai: Star Rail

  ![Gacha-StarRail-1](Screenshots/gacha-starrail-1.jpg)

  ![Gacha-StarRail-2](Screenshots/gacha-starrail-2.jpg)

  ![Gacha-StarRail-3](Screenshots/gacha-starrail-3.jpg)
</details>

## 下载

* 请在此仓库 [Releases](https://github.com/lgou2w/HoYo.Gacha/releases) 下载最新版。

* 或可以从镜像 [Release latest](https://hoyo-gacha.lgou2w.com/release/download?id=latest) 下载最新版。<sub>Powered by [Deno Deploy](https://deno.com/deploy).</sub>

### 注意事项

* 程序会在 **`运行目录`** 自动创建名为 **`HoYo.Gacha.db`** 的数据库文件。此文件中包含了 **`您的所有本地账号`** 和 **`全部的抽卡记录`** 数据。

* 请确保在 **`移动程序本体文件`** 或 **`迁移操作系统`** 时不要遗漏此数据库文件！

## 硬盘缓存

**关于从 `Chromium Disk Cache` 硬盘缓存获取抽卡链接的实现原理请参考：[硬盘缓存](DiskCache/README.md)**

## 特别感谢

* [UIGF organization](https://uigf.org)
* [vikiboss/gs-helper](https://github.com/vikiboss/gs-helper)

## 协议

> [!NOTE]
> MIT OR Apache-2.0 **仅供个人学习交流使用。请勿用于任何商业或违法违规用途。**
>
> 本软件不会向您索要任何关于 ©miHoYo 账户的账号密码信息，也不会收集任何用户数据。所产生的数据（包括但不限于使用数据、抽卡数据、UID 信息等）均保存在用户本地。

### 部分资源文件

[个人非商用授权](https://www.hanyi.com.cn/faq-doc-1) - 北京汉仪创新科技股份有限公司 版权所有

* [src/assets/汉仪文黑-85W.ttf](src/assets/%E6%B1%89%E4%BB%AA%E6%96%87%E9%BB%91-85W.ttf)

©miHoYo | 上海米哈游影铁科技有限公司 版权所有

* [src/assets/images/Logo.png](src/assets/images/Logo.png)
* [src/assets/images/genshin/*](src/assets/images/genshin)
* [src/assets/images/starrail/*](src/assets/images/starrail)
* [src/assets/images/zzz/*](src/assets/images/zzz)
* [src-tauri/icons/*](src-tauri/icons/)
