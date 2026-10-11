use rusqlite::{Connection, Error as RusqliteError, Params, Row};

/// Convenience query extension for [`Connection`].
///
/// Every method uses [`Connection::prepare_cached`] internally, so
/// statements with the same SQL text reuse the connection's statement
/// cache automatically. Callers never need to prepare manually.
pub trait ConnectionExt {
  /// Runs the query and collects all rows into a `Vec<T>`.
  fn fetch_all<T, P>(&self, sql: &str, params: P) -> Result<Vec<T>, RusqliteError>
  where
    P: Params,
    T: for<'r> TryFrom<&'r Row<'r>, Error = RusqliteError>;

  /// Runs the query and returns the first row.
  ///
  /// Returns [`rusqlite::Error::QueryReturnedNoRows`] if the result set is
  /// empty. Additional rows are silently ignored.
  fn fetch_one<T, P>(&self, sql: &str, params: P) -> Result<T, RusqliteError>
  where
    P: Params,
    T: for<'r> TryFrom<&'r Row<'r>, Error = RusqliteError>;

  /// Runs the query and returns the first row, if any.
  ///
  /// Returns `Ok(None)` if the result set is empty.
  fn fetch_optional<T, P>(&self, sql: &str, params: P) -> Result<Option<T>, RusqliteError>
  where
    P: Params,
    T: for<'r> TryFrom<&'r Row<'r>, Error = RusqliteError>;

  // /// Runs the query and expects exactly one row.
  // ///
  // /// Returns [`rusqlite::Error::QueryReturnedNoRows`] if the result set is
  // /// empty, or [`rusqlite::Error::QueryReturnedMoreThanOneRow`] if it
  // /// contains more than one row.
  // fn fetch_exactly_one<T, P>(&self, sql: &str, params: P) -> Result<T, RusqliteError>
  // where
  //   P: Params,
  //   T: for<'r> TryFrom<&'r Row<'r>, Error = RusqliteError>;

  /// Runs the query and returns the number of rows affected.
  ///
  /// This is a convenience method for [`Connection::execute`].
  fn execute<P>(&self, sql: &str, params: P) -> Result<usize, RusqliteError>
  where
    P: Params;
}

impl ConnectionExt for Connection {
  fn fetch_all<T, P>(&self, sql: &str, params: P) -> Result<Vec<T>, RusqliteError>
  where
    P: Params,
    T: for<'r> TryFrom<&'r Row<'r>, Error = RusqliteError>,
  {
    let mut stmt = self.prepare_cached(sql)?;
    let rows = stmt.query_map(params, |row| T::try_from(row))?;
    rows.collect()
  }

  fn fetch_one<T, P>(&self, sql: &str, params: P) -> Result<T, RusqliteError>
  where
    P: Params,
    T: for<'r> TryFrom<&'r Row<'r>, Error = RusqliteError>,
  {
    let mut stmt = self.prepare_cached(sql)?;
    stmt.query_row(params, |row| T::try_from(row))
  }

  fn fetch_optional<T, P>(&self, sql: &str, params: P) -> Result<Option<T>, RusqliteError>
  where
    P: Params,
    T: for<'r> TryFrom<&'r Row<'r>, Error = RusqliteError>,
  {
    use rusqlite::OptionalExtension;
    let mut stmt = self.prepare_cached(sql)?;
    stmt.query_row(params, |row| T::try_from(row)).optional()
  }

  // fn fetch_exactly_one<T, P>(&self, sql: &str, params: P) -> Result<T, RusqliteError>
  // where
  //   P: Params,
  //   T: for<'r> TryFrom<&'r Row<'r>, Error = RusqliteError>,
  // {
  //   let mut stmt = self.prepare_cached(sql)?;
  //   stmt.query_one(params, |row| T::try_from(row))
  // }

  fn execute<P>(&self, sql: &str, params: P) -> Result<usize, RusqliteError>
  where
    P: Params,
  {
    let mut stmt = self.prepare(sql)?; // no cache
    stmt.execute(params)
  }
}
