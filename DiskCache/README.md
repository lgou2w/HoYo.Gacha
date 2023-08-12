# Chromium Disk Cache

**如何从 `Chromium Disk Cache` 硬盘缓存获取祈愿链接的实现原理。**

> 以下内容目前是自己的研究和见解，如有错误和遗漏，欢迎补充。

## 简称

- `Chromium Disk Cache` 以下简称：`硬盘缓存`

## 目录

- [前言](#前言)
  - [什么是硬盘缓存](#什么是硬盘缓存)
  - [和原神有什么关系](#和原神有什么关系)
  - [为什么要用这种方式](#为什么要用这种方式)
- [结构](#结构)
  - [了解硬盘缓存文件结构](#了解硬盘缓存文件结构)
  - [硬盘缓存的目录文件](#硬盘缓存的目录文件)
  - [索引文件](#索引文件)
    - [结构头](#结构头)
    - [LRU](#lru)
    - [缓存地址](#缓存地址)
  - [数据块文件](#数据块文件)
  - [存储条目](#存储条目)
- [实现](#实现)
  - [Rust](#rust)
  - [Node.js](#nodejs)
- [参考](#参考)

## 前言

### 什么是硬盘缓存

`磁盘缓存` 存储从 Web 获取的资源，以便以后可以在需要时快速访问它们。

引用自：[Overview](https://www.chromium.org/developers/design-documents/network-stack/disk-cache/#overview)

### 和原神有什么关系

在原神游戏内打开公告页面或者祈愿历史记录页面。其实就是一个名为 [ZFGameBrowser](https://zenfulcrum.com/browser/docs/Readme.html) 的内置浏览器，它是基于 `Chromium` 内核的。所以这些页面的 `URL` 链接都会被存储在 `硬盘缓存` 里面。

### 为什么要用这种方式

在查看了很多个开源的祈愿记录导出工具，它们基本都是直接使用 `UTF-8` 编码读取 `data_2` 这个文件的方式去查找最后一个祈愿链接。但是最后一个并不一定是最新的有效的，可能是很久之前已经过期了的链接。当你了解 `硬盘缓存` 的数据结构后，就能知道其原因。

## 结构

### 了解硬盘缓存文件结构

![disk-cache-files.png](files.png)

This diagram shows a disk cache with 7 files on disk: the index file, 5 block-files and one separate file. data_1 and data_4 are chained together so they store blocks of the same size (256 bytes), while data_2 stores blocks of 1KB and data_3 stores blocks of 4 KB. The depicted entry has its key stored outside the EntryStore structure, and given that it uses two blocks, it must be between one and two kilobytes. This entry also has two data streams, one for the HTTP headers (less than 256 bytes) and another one for the actual payload (more than 16 KB so it lives on a dedicated file). All blue arrows indicate that a cache address is used to locate another piece of data.

图片和原文引用自：[The Big Picture](https://www.chromium.org/developers/design-documents/network-stack/disk-cache/#the-big-picture)

> 图片的原文说明对实际结构的理解可能会不太清楚，故不作翻译。详细请见下：

### 硬盘缓存的目录文件

| 文件名      | 结构      | 备注 |
| ---------- | --------- | ---- |
| `index`    | 索引文件   | `Cache address` 缓存地址，哈希指针 |
| `data_0`   | 数据块文件 | `Rankings` |
| `data_1`   | 数据块文件 | `Entry store` 存储条目 |
| `data_2`   | 数据块文件 | `Long key` 长密钥、长键、URL |
| `data_3`   | 数据块文件 | `未知` |
| `data_4`   | 数据块文件 | `Http Headers` HTTP 头 |
| `f_######` | 外部块文件 | `Payload` HTTP 有效载荷 |

这些数据文件以二进制 `Little-Endian` 小端字节序（低端字节序）存储的。

> 注意：目前文档实现的硬盘缓存结构是 v2 版本。

### 索引文件

索引文件是一个 `缓存地址表` 或者 `哈希指针表`。它由 `256 字节的结构头` 和 `112 字节的 LRU 驱逐控制数据` 以及 `至少 65536 个缓存地址` 构成。但实际的缓存地址数量由 `结构头` 内的 `table_len` 字段控制。其每一个缓存地址对应数据块文件 `data_1` 中的指定 `Entry store` 存储条目数据。

#### 结构头

索引文件的结构头是一个 `256` 字节的数据结构。

| 字段名         | 类型                             | 描述 |
| ------------- | -------------------------------- | ---- |
| `magic`       | `unsigned int` 无符号 32 位整数   | `魔数签名` 其值为：`0xC103CAC3` |
| `version`     | `unsigned int` 无符号 32 位整数   | `版本号` 已知有：`0x20000`、`0x20001`、`0x30000` 三个版本。 |
| `num_entries` | `int` 有符号 32 位整数            | `当前存储的条目数` |
| `num_bytes`   | `int` 有符号 32 位整数            | `存储数据的总大小` |
| `last_file`   | `int` 有符号 32 位整数            | `上次创建的外部文件` 表示 `f_######` 中的 # 值。 |
| `this_id`     | `int` 有符号 32 位整数            | `所有正在更改的条目的 ID（脏标志）` |
| `stats`       | `unsigned int` 无符号 32 位整数   | `存储使用数据` |
| `table_len`   | `int` 有符号 32 位整数            | `缓存地址表的实际大小`（为 0 时 == 0x10000 \[65536]） |
| `crash`       | `int` 有符号 32 位整数            | `表示之前的崩溃` |
| `experiment`  | `int` 有符号 32 位整数            | `正在进行的测试的 ID` |
| `create_time` | `unsigned int64` 无符号 64 位整数 | `这组文件的创建时间` |
| `pad`         | `int[52]` 有符号 32 位整数数组    | `用于填充的空字节数组` 其长度为 52 |

#### LRU

索引文件的 LRU 驱逐控制数据是一个 `112` 字节的数据结构。

| 字段名            | 类型                                 | 描述 |
| ---------------- | ------------------------------------ | ---- |
| `pad1`           | `int[2]` 有符号 32 位整数数组          | `用于填充的空字节数组` 其长度为 2 |
| `failled`        | `int` 有符号 32 位整数                | `用于告知我们何时填充缓存的标志` |
| `sizes`          | `int[5]` 无符号 32 位整数数组          | `大小数组。其长度为 5` |
| `heads`          | `unsigned int[5]` 无符号 32 位整数数组 | `头部缓存地址数组。其长度为 5` |
| `tails`          | `unsigned int[5]` 无符号 32 位整数数组 | `尾部缓存地址数组。其长度为 5` |
| `transaction`    | `unsigned int` 无符号 32 位整数       | `In-flight operation target` |
| `operation`      | `int` 有符号 32 位整数                | `Actual in-flight operation` |
| `operation_list` | `int` 有符号 32 位整数                | `In-flight operation list` |
| `pad2`           | `int[7]` 有符号 32 位整数数组          | `用于填充的空字节数组` 其长度为 7 |

#### 缓存地址

Every piece of data stored by the disk cache has a given “cache address”. The cache address is simply a 32-bit number that describes exactly where the data is actually located.

引用自：[Cache Address](https://www.chromium.org/developers/design-documents/network-stack/disk-cache/#cache-address)

> 表示一个无符号的 32 位整数，准确的描述了一条数据的实际位置。实际就是一个 `FLAG` 状态标志寄存器，需要用位操作来获取其状态值。

例子：

- `0x00000000`：未初始化
- `0x8000002A`：外部文件 `f_00002A`
- `0xA0010003`：块文件号 1（data_1），初始块号 3，长度为 1 个块。

详细的状态获取可以查看：[disk_cache/addr.rs](../src-tauri/src/disk_cache/addr.rs)

### 数据块文件

数据块文件都是由 `8192 字节的结构头` 和实际数据构成。具体的数据大小取决于数据块文件编号类型。

| 字段名            | 类型                                    | 描述 |
| ---------------- | --------------------------------------- | ---- |
| `magic`          | `unsigned int` 无符号 32 位整数           | `魔数签名` 其值为：`0xC104CAC3` |
| `version`        | `unsigned int` 无符号 32 位整数           | `版本号` 已知有：`0x20000`、`0x30000` 两个版本。 |
| `this_file`      | `int16` 有符号 16 位整数                  | `此文件的索引号` |
| `next_file`      | `int16` 有符号 16 位整数                  | `当这个文件已满时，下一个文件的索引号` |
| `entry_size`     | `int` 有符号 32 位整数                    | `此文件的块大小` |
| `num_entries`    | `int` 有符号 32 位整数                    | `存储的条目数量` |
| `max_entries`    | `int` 有符号 32 位整数                    | `当前最大条数数量` |
| `empty`          | `int[4]` 有符号 32 位整数数组             | `每种类型的空条目计数器` 其长度为 4 |
| `hints`          | `int[4]` 有符号 32 位整数数组             | `每个条目类型的最后使用位置` 其长度为 4 |
| `updating`       | `int` 有符号 32 位整数                   | `跟踪标头的更新` |
| `user`           | `int[5]` 有符号 32 位整数数组             | `User` 其长度为 5 |
| `allocation_map` | `unsigned int[2028]` 无符号 32 位整数数组 | `Allocation map` 其长度为 2028 |

### 存储条目

已知数据块文件 `data_1` 内的存储条目数据结构。

> 注意：其他数据块文件的块数据头也有可能是这个结构，但个人未其验证。另见：[实现](#实现)

| 字段名           | 类型                                    | 描述 |
| --------------- | --------------------------------------- | ---- |
| `hash`          | `unsigned int` 无符号 32 位整数          | `键的完整哈希` |
| `next`          | `unsigned int` 无符号 32 位整数          | `具有相同哈希或存储桶的下一个条目` |
| `rankings_node` | `unsigned int` 无符号 32 位整数          | `Rankings 节点` |
| `reuse_count`   | `int` 有符号 32 位整数                   | `使用次数` |
| `refetch_count` | `int` 有符号 32 位整数                   | `重获取次数` |
| `state`         | `int` 有符号 32 位整数                   | `当前状态` |
| `creation_time` | `unsigned int64` 无符号 64 位整数        | `创建时间` |
| `key_len`       | `int` 有符号 32 位整数                   | `键的实际长度` |
| `long_key`      | `unsigned int` 无符号 32 位整数          | `可选的长键缓存地址` |
| `data_size`     | `unsigned int[4]` 无符号 32 位整数数组   | `最多可以为每个存储 4 个数据流` 长度为 4 |
| `data_addr`     | `unsigned int[4]` 无符号 32 位整数数组   | `数据条目缓存地址` 其长度为 4 |
| `flags`         | `unsigned int` 无符号 32 位整数          | `条目的标志` |
| `pad`           | `int[4]` 有符号 32 位整数数组            | `用于填充的空字节数组` 其长度为 4 |
| `self_hash`     | `unsigned int` 无符号 32 位整数          | `The hash of EntryStore up to this point` |
| `key`           | `char[160]` 8 位字节数组                | `键值` 其长度为 160 |

## 实现

由于只需要获取祈愿链接，所以我们只需要用到 `index`、`data_1` 以及 `data_2` 这三个数据文件。从这个 [图中](#了解硬盘缓存文件结构) 可以知道 `index` 文件包含了所有的缓存地址，其每一条地址指向了 `data_1` 文件的某个块数据。这个块数据就是一项 `Entry store` 存储条目。从这个存储条目的 `creation_time` 创建时间和 `key`、`long_key` 就可以获取到这项记录的 `URL` 链接和创建时间。

> 注意：祈愿链接是包含了 `authkey` 参数的一个非常长的链接，而 `Entry store` 存储条目记录的字段 `key` 是无法存储的。所以要通过 `long_key` 这个长键的缓存地址获取其指向 `data_2` 文件的块数据，才能够得到正确的完整的祈愿链接数据。

流程说明如下：

1. 读取 `index` 索引文件的所有缓存地址。
2. 遍历这个缓存地址表从其 `data_1` 文件依次读取到 `Entry store` 存储条目。
3. 判断这个存储条目的 `long_key` 不为 `0` 时，说明这是一个有效的长键缓存地址。
4. 再用这个 `long_key` 长键缓存地址从其 `data_2` 文件读取所对应的 URL 链接数据。
5. 判断是否为正确的祈愿链接，并和存储条目的 `creation_time` 创建时间一同添加到集合。
6. 最后按创建时间倒序排序，其第一个就是最新的祈愿链接。

> 下面有 Rust 和 Node.js 语言的对应实现源代码。由于本人对其他语言，例如 C#、Python、Go 这些了解不深，无法提供其实现。

### Rust

请参考本仓库内的源代码实现：

- 硬盘缓存：[disk_cache](../src-tauri/src/disk_cache)
- 获取祈愿链接：[gacha/utilities.rs](https://github.com/lgou2w/HoYo.Gacha/blob/139b9b6/src-tauri/src/gacha/utilities.rs#L166-L225)

### Node.js

索引文件的读取：

> 结构内的 `pad` 和 `lru` 字段对获取祈愿链接没有作用，所以直接用 `Buffer.slice` 截取比较方便。而 `table` 字段就是索引文件实际的缓存地址表数据，我们通过 `table_len` 字段可以知道实际长度然后遍历读取即可。并且读取到 `addr` 后的地方使用到了一个 `if ((addr & 0x80000000) !== 0)` 的操作，这一步是只获取有效的缓存地址。因为如果某一项缓存地址未被使用时，它的值一定为 `0` 。

```typescript
import fs from 'fs';

interface IndexFile {
  magic: number       // unsigned int
  version: number     // unsigned int
  num_entries: number // int
  num_bytes: number   // int
  last_file: number   // int
  this_id: number     // int
  stats: number       // unsigned int
  table_len: number   // int
  crash: number       // int
  experiment: number  // int
  create_time: bigint // unsigned int64
  pad: Buffer         // int[52] -> 52 * 4 = 208 bytes
  lru: Buffer         // 112 bytes lru data
  table: number[]     // cache address
}

function readIndexFile(file: string): IndexFile {
  const buf: Buffer = fs.readFileSync(file, { flag: 'r' });

  let offset = 0;
  const magic = buf.readUInt32LE(offset); offset += 4;
  const version = buf.readUInt32LE(offset); offset += 4;
  const num_entries = buf.readInt32LE(offset); offset += 4;
  const num_bytes = buf.readInt32LE(offset); offset += 4;
  const last_file = buf.readInt32LE(offset); offset += 4;
  const this_id = buf.readInt32LE(offset); offset += 4;
  const stats = buf.readUInt32LE(offset); offset += 4;
  const table_len = buf.readInt32LE(offset); offset += 4;
  const crash = buf.readInt32LE(offset); offset += 4;
  const experiment = buf.readInt32LE(offset); offset += 4;
  const create_time = buf.readBigUInt64LE(offset); offset += 8;
  const pad = buf.slice(offset, offset + 52 * 4); offset += 52 * 4;
  const lru = buf.slice(offset, offset + 112); offset += 112;
  const table: number[] = [];

  for (let i = 0; i < table_len; i++) {
    let addr = buf.readUInt32LE(offset);
    if ((addr & 0x80000000) !== 0) {
      // 这一步是只获取有效的缓存地址
      table.push(addr);
    }
    offset += 4;
  }

  return { magic, version, num_entries, num_bytes, last_file, this_id,
    stats, table_len, crash, experiment, create_time, pad, lru, table };
}
```

数据块文件的读取：

```typescript
import fs from 'fs';

interface BlockFile {
  magic: number          // unsigned int
  version: number        // unsigned int
  this_file: number      // int16
  next_file: number      // int16
  entry_size: number     // int
  num_entries: number    // int
  max_entries: number    // int
  empty: number[]        // int[4]
  hints: number[]        // int[4]
  updating: number       // int
  user: number[]         // int[5]
  allocation_map: Buffer // unsigned int[2028] -> 2028 * 4 = 8112 bytes
  data: Buffer           // block data
}

function readBlockFile(file: string): BlockFile {
  const buf = fs.readFileSync(file, { flag: 'r' });

  let offset = 0;
  const magic = buf.readUInt32LE(offset); offset += 4;
  const version = buf.readUInt32LE(offset); offset += 4;
  const this_file = buf.readInt16LE(offset); offset += 2;
  const next_file = buf.readInt16LE(offset); offset += 2;
  const entry_size = buf.readInt32LE(offset); offset += 4;
  const num_entries = buf.readInt32LE(offset); offset += 4;
  const max_entries = buf.readInt32LE(offset); offset += 4;

  function readInt32LEArray(length: number): number[] {
    const array: number[] = [];
    for (let i = 0; i < length; i++) {
      let value = buf.readInt32LE(offset);
      array.push(value);
      offset += 4;
    }
    return array;
  }

  const empty = readInt32LEArray(4);
  const hints = readInt32LEArray(4);
  const updating = buf.readInt32LE(offset); offset += 4;
  const user = readInt32LEArray(5);
  const allocation_map = buf.slice(offset, offset + 2028 * 4); offset += 2028 * 4;
  const data = buf.slice(offset);

  return { magic, version, this_file, next_file, entry_size, num_entries,
    max_entries, empty, hints, updating, user, allocation_map, data };
}

const BlockSizeMappings: Record<number, number> = {
  1: 36,
  2: 256,
  3: 1024,
  4: 4096,
  5: 8,
  6: 104,
  7: 48
};

function readBlockFileData(blockFile: BlockFile, addr: number): Buffer {
  if ((addr & 0x80000000) === 0) {
    throw new Error('Invalid address');
  }

  if ((addr & 0x70000000) === 0) {
    throw new Error('Address is not block file');
  } else {
    const file_type = (addr & 0x70000000) >> 28;
    const block_size = BlockSizeMappings[file_type] || 0;
    const num_blocks = ((addr & 0x03000000) >> 24) + 1;
    const offset = (addr & 0x0000FFFF) * block_size;
    const length = block_size * num_blocks;
    return blockFile.data.slice(offset, offset + length);
  }
}
```

存储条目的读取：

```typescript
interface EntryStore {
  hash: number          // unsigned int
  next: number          // unsigned int
  rankings_node: number // unsigned int
  reuse_count: number   // int
  refetch_count: number // int
  state: number         // int
  creation_time: bigint // unsigned int64
  key_len: number       // int
  long_key: number      // unsigned int
  data_size: number[]   // unsigned int[4]
  data_addr: number[]   // unsigned int[4]
  flags: number         // unsigned int
  pad: Buffer           // int[4] -> 4 * 4 = 16 bytes
  self_hash: number     // unsigned int
  key: Buffer           // char[160]
}

function readEntryStore(blockFile: BlockFile, addr: number): EntryStore {
  const data = readBlockFileData(blockFile, addr);

  let offset = 0;
  const hash = data.readUInt32LE(offset); offset += 4;
  const next = data.readUInt32LE(offset); offset += 4;
  const rankings_node = data.readUInt32LE(offset); offset += 4;
  const reuse_count = data.readInt32LE(offset); offset += 4;
  const refetch_count = data.readInt32LE(offset); offset += 4;
  const state = data.readInt32LE(offset); offset += 4;
  const creation_time = data.readBigUInt64LE(offset); offset += 8;
  const key_len = data.readInt32LE(offset); offset += 4;
  const long_key = data.readUInt32LE(offset); offset += 4;

  const data_size = [
    data.readUInt32LE(offset + 0),
    data.readUInt32LE(offset + 4),
    data.readUInt32LE(offset + 8),
    data.readUInt32LE(offset + 12)
  ]; offset += 16;
  const data_addr = [
    data.readUInt32LE(offset + 0),
    data.readUInt32LE(offset + 4),
    data.readUInt32LE(offset + 8),
    data.readUInt32LE(offset + 12)
  ]; offset += 16;

  const flags = data.readUInt32LE(offset); offset += 4;
  const pad = data.slice(offset, offset + 16); offset += 16;
  const self_hash = data.readUInt32LE(offset); offset += 4;
  const key = data.slice(offset, offset + 160);

  return { hash, next, rankings_node, reuse_count, refetch_count, state, creation_time,
    key_len, long_key, data_size, data_addr, flags, pad, self_hash, key };
}
```

获取祈愿链接：

> 函数的 `genshinDataDir` 参数就是原神的数据目录。例如：`X:\Genshin Impact\Genshin Impact Game\YuanShen_Data`。可以从读取 `output_log.txt` 文件获取到这个路径。

```typescript
import path from 'path';

function findGachaUrl(genshinDataDir: string): { creation_time: Date, url: string } {
  const cacheDir = path.join(genshinDataDir, 'webCaches/Cache/Cache_Data');
  const indexFile = readIndexFile(path.join(cacheDir, 'index'));
  const blockFile1 = readBlockFile(path.join(cacheDir, 'data_1'));
  const blockFile2 = readBlockFile(path.join(cacheDir, 'data_2'));

  const records: Array<{ creation_time: number, url: string }> = [];
  for (const addr of indexFile.table) {
    const entry = readEntryStore(blockFile1, addr);
    if (entry.long_key === 0) {
      // 存储条目的长键为 0 时说明这个链接是短链接，并不是我们需要的祈愿链接
      continue;
    }

    // 用这个长键缓存地址从 data_2 文件获取链接数据
    // 然后从 key_len 字段截取到正确的链接数据并转为 UTF-8 字符串
    const data = readBlockFileData(blockFile2, entry.long_key);
    let url = data.slice(0, entry.key_len).toString('utf-8');

    if (!url.includes('/event/gacha_info/api/getGachaLog?')) {
      // 这个链接并不一定就是祈愿链接，没有包含这个端点就跳过
      continue;
    }

    // 截取正确的部分
    if (url.startsWith('1/0/')) {
      url = url.substring(4);
    }

    // 将 Windows ticks 转换成 Unix 时间戳
    const timestamp = entry.creation_time / 1_000_000n - 11_644_473_600n;

    records.push({
      creation_time: Number(timestamp),
      url
    });
  }

  // 按时间戳倒序排序
  records.sort((a, b) => b.creation_time - a.creation_time);

  // 获取第一个记录
  const first = records[0];
  if (!first) {
    throw new Error('Gacha url not found');
  }

  return {
    creation_time: new Date(first.creation_time * 1000),
    url: first.url
  };
}
```

## 参考

https://www.chromium.org/developers/design-documents/network-stack/disk-cache/

https://www.chromium.org/developers/design-documents/network-stack/disk-cache/disk-cache-v3

https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format_base.h

https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format.h

https://github.com/libyal/dtformats/blob/main/documentation/Chrome%20Cache%20file%20format.asciidoc
