#![forbid(unsafe_code)]

use std::sync::LazyLock;

use regex::Regex;

// Gacha URL must have this format of domain and contain the `authkey` parameter.
//   https://webstatic.mihoyo.com/xxx/event/xxx/index.html?authkey
//   https://public-operation-xxx.mihoyo.com/gacha_info/api/getGachaLog?authkey
//   https://public-operation-xxx-sg.hoyoverse.com/gacha_info/api/getGachaLog?authkey
//
// Required params:
//   sign_type, authkey_ver, authkey
//   game_biz, region, lang
//
// Optional params:
//   Genshin Impact    : gacha_type & init_type
//   Honkai: Star Rail : gacha_type & default_gacha_type
//   Zenless Zone Zero : real_gacha_type & init_log_gacha_base_type
//
// Therefore, this regular expression only checks for conformity to the basic format and authkey;
// you still need to validate the specific necessary parameters yourself.
pub static REGEX_GACHA_URL: LazyLock<Regex> = LazyLock::new(|| {
  Regex::new(r"(?i)^https:\/\/.*(mihoyo.com|hoyoverse.com).*\?.*(authkey\=.+).*$").unwrap()
});

// Exports

pub mod dirty;
pub mod parse;

#[cfg(test)]
mod tests;
