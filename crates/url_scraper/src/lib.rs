#![forbid(unsafe_code)]

pub mod requester;
pub mod scraper;
mod types;

pub use types::*;

#[cfg(test)]
mod tests;
