- **English**
- [简体中文](README.md)

# Genshin Gacha (WIP)

A tool to get `Genshin Impact` gacha logs.

No need for a local proxy server. Just read the chromium disk cache file and request the api endpoint.

> I'm learning Rust, and there can be a lot of problems with code design. Contributions and pull requests are welcome.

## Features

- [x] Get gacha url.
- [x] Fetch all gacha logs.
- [x] Export JSON ([UIGF](https://www.snapgenshin.com/development/UIGF.html)), Excel formats.
- [ ] More in development...

## Reference

https://www.chromium.org/developers/design-documents/network-stack/disk-cache/

https://www.chromium.org/developers/design-documents/network-stack/disk-cache/disk-cache-v3

https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format_base.h

https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format.h

https://github.com/libyal/dtformats/blob/main/documentation/Chrome%20Cache%20file%20format.asciidoc

## License

MIT OR Apache-2.0
