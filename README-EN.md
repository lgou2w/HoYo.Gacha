- **English**
- [简体中文](README.md)

# Genshin Gacha

<p>
<a href="https://github.com/lgou2w/genshin-gacha/actions"><img src="https://img.shields.io/github/actions/workflow/status/lgou2w/genshin-gacha/build.yml?branch=main&logo=github&style=flat-square"/></a>
<a href="https://github.com/lgou2w/genshin-gacha/releases"><img src="https://img.shields.io/github/v/release/lgou2w/genshin-gacha?logo=github&style=flat-square" /></a>
</p>

A tool to get **`Genshin Impact`** gacha logs.

**No need for a local proxy server**. Just read the `Chromium` [disk cache](DISK-CACHE.md) file and request the api endpoint.

> **I'm learning Rust, and there can be a lot of problems with code design. Contributions and pull requests are welcome.**

## Features

- [x] Get gacha url.
- [x] Fetch the latest gacha logs.
- [x] Export `JSON` ([UIGF](https://www.snapgenshin.com/development/UIGF.html)) and `Excel` formats.
- [x] Import old `JSON` ([UIGF](https://www.snapgenshin.com/development/UIGF.html)) data and auto-complete Fetch the latest gacha logs, merge them, and export them.
- [x] Command line tool. See also: [CLI](https://github.com/lgou2w/genshin-gacha/tree/main/cli/README-EN.md)
- [ ] More tools in development...

## Disk Cache

**For more information about how to get a gacha url from the `Chromium Disk Cache`. See also: [DISK-CACHE.md](DISK-CACHE.md)**

## License

MIT OR Apache-2.0
