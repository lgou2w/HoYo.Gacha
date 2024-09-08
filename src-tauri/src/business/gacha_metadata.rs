use std::fmt::{self, Debug};
use std::fs::File;
use std::io::{self, Read};
use std::ops::Deref;
use std::path::Path;
use std::time::Instant;

use once_cell::sync::Lazy;
use sha1::{Digest, Sha1};
use tracing::info;

use crate::models::{Metadata, MetadataSource};

const EMBEDDED_JSON_METADATA: &[u8] = include_bytes!("./gacha_metadata.json");

static EMBEDDED_METADATA: Lazy<GachaMetadata> = Lazy::new(|| {
  let start = Instant::now();
  let metadata =
    GachaMetadata::from_bytes(EMBEDDED_JSON_METADATA).expect("Failed to load embedded metadata");

  info!(
    message = "Embedded gacha metadata loaded successfully",
    elapsed = ?start.elapsed(),
    %metadata.hash,
  );

  metadata
});

pub struct GachaMetadata {
  pub hash: String, // SHA-1
  inner: Metadata,
}

impl GachaMetadata {
  #[inline]
  pub fn embedded() -> &'static Self {
    &EMBEDDED_METADATA
  }

  pub fn from_file(path: impl AsRef<Path>) -> io::Result<serde_json::Result<Self>> {
    let mut file = File::open(path)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;

    Ok(Self::from_bytes(&buffer))
  }

  pub fn from_bytes(slice: &[u8]) -> serde_json::Result<Self> {
    let hash = {
      let mut sha1 = Sha1::new();
      sha1.update(slice);
      sha1
        .finalize()
        .iter()
        .fold(String::with_capacity(40), |mut output, b| {
          use std::fmt::Write;
          let _ = write!(output, "{b:02x}"); // lowercase
          output
        })
    };

    let inner = Metadata::from_json(MetadataSource::Bytes(slice))?;

    Ok(Self { hash, inner })
  }
}

impl Debug for GachaMetadata {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_struct("GachaMetadata")
      .field("hash", &self.hash)
      .field("metadata", &self.inner)
      .finish()
  }
}

impl AsRef<Metadata> for GachaMetadata {
  fn as_ref(&self) -> &Metadata {
    &self.inner
  }
}

impl Deref for GachaMetadata {
  type Target = Metadata;

  fn deref(&self) -> &Self::Target {
    &self.inner
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_embedded_metadata() {
    let _ = GachaMetadata::embedded();
  }
}
