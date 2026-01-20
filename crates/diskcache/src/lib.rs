// MIT License
// Copyright (c) 2022 - Present The lgou2w <lgou2w@hotmail.com>
//
// Google Chromium Disk Cache
//   Endianness: Little-Endian
//   References:
//     https://www.chromium.org/developers/design-documents/network-stack/disk-cache/
//     https://www.chromium.org/developers/design-documents/network-stack/disk-cache/disk-cache-v3
//     https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format_base.h
//     https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format.h
//
//   Outdated: (Not recommended, contains incorrect)
//     https://github.com/libyal/dtformats/blob/main/documentation/Chrome%20Cache%20file%20format.asciidoc
//
// !
// This implementation is Disk Cache Version 2.1, not 3.0.
// Because 'Genshin Impact', 'Honkai: Star Rail' and 'Zenless Zone Zero' are both version 2.1.
//

mod addr;
mod block_file;
mod entry_store;
mod index_file;
mod key_collector;
pub(crate) mod reader;

pub use addr::*;
pub use block_file::*;
pub use entry_store::*;
pub use index_file::*;
pub use key_collector::*;
