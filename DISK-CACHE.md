# Chromium Disk Cache

**如何从 `Chromium Disk Cache` 硬盘缓存获取祈愿链接的实现原理。**

> 以下内容目前是自己的研究和见解，如有错误和遗漏，欢迎补充。

## 简称

- `Chromium Disk Cache` 以下简称：`硬盘缓存`

## 目录

- [前言](#前言)
  - [什么是硬盘缓存](#什么是硬盘缓存)
  - [和原神有何关系](#和原神有何关系)
- [结构](#结构)
- [实现](#实现)
- [参考](#参考)

## 前言

### 什么是硬盘缓存

`磁盘缓存` 存储从 Web 获取的资源，以便以后可以在需要时快速访问它们。
引用自：[Overview](https://www.chromium.org/developers/design-documents/network-stack/disk-cache/#overview)

### 和原神有何关系

在原神游戏内打开公告页面或者祈愿历史记录页面。其实就是一个名为 `ZFGameBrowser.exe` 的内置浏览器，它是基于 `Chromium` 内核的。所以这些页面的 URL 链接都会被存储在 `硬盘缓存` 里面。

## 结构

WIP...

## 实现

WIP...

## 参考

WIP...
