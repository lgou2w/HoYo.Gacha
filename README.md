- **简体中文**
- [English](README-EN.md)

# Genshin Gacha (WIP)

<p>
<a href="https://github.com/lgou2w/genshin-gacha/actions"><img src="https://img.shields.io/github/workflow/status/lgou2w/genshin-gacha/Build?logo=github&style=flat-square"/></a>
</p>

一个获取 `原神` 祈愿记录的工具。

无需任何本地代理服务器。只需读取 Chromium 磁盘缓存文件并请求 API 端点。

> 我正在学习 Rust，代码设计可能存在很多问题。欢迎贡献和 PR。

## 功能

- [x] 获取祈愿链接。
- [x] 获取所有祈愿记录。
- [x] 导出 JSON（[UIGF](https://www.snapgenshin.com/development/UIGF.html)），Excel 格式。
- [ ] 更多开发中...

## 参考

https://www.chromium.org/developers/design-documents/network-stack/disk-cache/

https://www.chromium.org/developers/design-documents/network-stack/disk-cache/disk-cache-v3

https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format_base.h

https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format.h

https://github.com/libyal/dtformats/blob/main/documentation/Chrome%20Cache%20file%20format.asciidoc

## 协议

MIT OR Apache-2.0
