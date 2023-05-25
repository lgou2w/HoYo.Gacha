#![allow(unused)]

extern crate shadow_rs;

pub const ID: &str = "com.wxwatch.gacha.tracker";
pub const NAME: &str = "Gacha Tracker";
pub const DATABASE: &str = "com.wxwatch.gacha.tracker.db";

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const AUTHOR: &str = env!("CARGO_PKG_AUTHORS");
pub const REPOSITORY: &str = env!("CARGO_PKG_REPOSITORY");

/// See: https://github.com/baoyachi/shadow-rs

shadow_rs::shadow!(build);

pub const RUST_VERSION: &str = build::RUST_VERSION;
pub const RUST_CHANNEL: &str = build::RUST_CHANNEL;
pub const CARGO_VERSION: &str = build::CARGO_VERSION;
pub const BUILD_OS: &str = build::BUILD_OS;
pub const BUILD_TARGET: &str = build::BUILD_TARGET;
pub const BUILD_TIME: &str = build::BUILD_TIME_3339;
pub const COMMIT_DATE: &str = build::COMMIT_DATE_3339;
pub const COMMIT_AUTHOR: &str = build::COMMIT_AUTHOR;
pub const COMMIT_EMAIL: &str = build::COMMIT_EMAIL;
pub const COMMIT_HASH: &str = build::COMMIT_HASH;
pub const COMMIT_SHORT: &str = build::SHORT_COMMIT;
pub const COMMIT_TAG: &str = build::TAG;
pub const COMMIT_LAST_TAG: &str = build::LAST_TAG;
