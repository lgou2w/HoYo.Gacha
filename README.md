- **简体中文**
- [English](README-EN.md)

# Genshin Gacha

<p>
<a href="https://github.com/lgou2w/genshin-gacha/actions"><img src="https://img.shields.io/github/workflow/status/lgou2w/genshin-gacha/Build?logo=github&style=flat-square"/></a>
<a href="https://github.com/lgou2w/genshin-gacha/releases"><img src="https://img.shields.io/github/v/release/lgou2w/genshin-gacha?logo=github&style=flat-square" /></a>
</p>

用于获取 **`原神`** 祈愿记录的工具。

无需任何本地代理服务器。只需读取 `Chromium` 硬盘缓存文件并请求 API 端点。

> **我正在学习 Rust，代码设计可能存在很多问题。欢迎贡献和 PR。**

## 功能

- [x] 获取祈愿链接。
- [x] 获取最新的祈愿记录。
- [x] 导出为 `JSON`（[UIGF](https://www.snapgenshin.com/development/UIGF.html)）和 `Excel` 格式。
- [x] 导入旧的 `JSON`（[UIGF](https://www.snapgenshin.com/development/UIGF.html)）数据并自动完成获取最新的祈愿记录然后合并，最后导出。
- [x] 命令行工具。另见：[CLI](https://github.com/lgou2w/genshin-gacha/tree/main/cli/README.md)
- [ ] 更多工具开发中...

## 参考

> **关于从 `Chromium` 硬盘缓存获取祈愿链接的实现原理请参考：[DISK-CACHE.md](DISK-CACHE.md)**

https://www.chromium.org/developers/design-documents/network-stack/disk-cache/

https://www.chromium.org/developers/design-documents/network-stack/disk-cache/disk-cache-v3

https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format_base.h

https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format.h

https://github.com/libyal/dtformats/blob/main/documentation/Chrome%20Cache%20file%20format.asciidoc

## 协议

MIT OR Apache-2.0
