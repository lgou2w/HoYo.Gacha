use std::io::{Read, Result};

use crate::Addr;

macro_rules! impl_read_num {
  ($num:ty, $read:ident) => {
    fn $read(&mut self) -> Result<$num> {
      const SIZE: usize = std::mem::size_of::<$num>();

      let bytes = self.read_u8_slice::<SIZE>()?;
      Ok(<$num>::from_le_bytes(bytes)) // Little-Endian
    }
  };
}

macro_rules! impl_read_num_into {
  ($num:ty, $read:ident) => {
    fn $read<const LENGTH: usize>(&mut self) -> Result<[$num; LENGTH]> {
      let mut dst: [$num; LENGTH] = [<$num>::default(); LENGTH];
      {
        let buf = unsafe { slice_to_u8_mut(&mut dst) };
        self.read_exact(buf)?;
      }

      if cfg!(target_endian = "big") {
        for n in &mut dst {
          *n = <$num>::to_le(*n); // Little-Endian
        }
      }

      Ok(dst)
    }
  };
}

pub trait DiskCacheRead: Read {
  fn read_u8_slice<const LENGTH: usize>(&mut self) -> Result<[u8; LENGTH]> {
    let mut buf = [0; LENGTH];
    self.read_exact(&mut buf)?;
    Ok(buf)
  }

  impl_read_num! { i16, read_i16 }
  impl_read_num! { i32, read_i32 }
  impl_read_num! { u32, read_u32 }
  impl_read_num! { u64, read_u64 }

  impl_read_num_into! { i32, read_i32_into }
  impl_read_num_into! { u32, read_u32_into }

  fn read_addr(&mut self) -> Result<Addr> {
    let addr = self.read_u32()?;
    Ok(Addr::from(addr))
  }

  fn read_addr_into<const LENGTH: usize>(&mut self) -> Result<[Addr; LENGTH]> {
    let addrs = self.read_u32_into::<LENGTH>()?;
    Ok(addrs.map(Addr::from))
  }
}

impl<R: Read + ?Sized> DiskCacheRead for R {}

//
// This function is categorized as a Copyright MIT https://github.com/BurntSushi/byteorder
// Source code:
//   https://github.com/BurntSushi/byteorder/blob/2e17045ca2580719b2df78973901b56eb8a86f49/src/io.rs#L1581-L1592
//
/// Convert a slice of T (where T is plain old data) to its mutable binary
/// representation.
///
/// This function is wildly unsafe because it permits arbitrary modification of
/// the binary representation of any `Copy` type. Use with care. It's intended
/// to be called only where `T` is a numeric type.
unsafe fn slice_to_u8_mut<T: Copy>(slice: &mut [T]) -> &mut [u8] {
  use core::slice::from_raw_parts_mut;
  use std::mem::size_of;

  // HACK: Get the size of type `T`, not the variable `slice`
  #[allow(clippy::manual_slice_size_calculation)]
  let len = size_of::<T>() * slice.len();

  unsafe { from_raw_parts_mut(slice.as_mut_ptr() as *mut u8, len) }
}
