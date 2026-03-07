BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS `HG_KVS` (
  `key`        TEXT NOT NULL PRIMARY KEY,
  `val`        TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `HG_ACCOUNTS` (
  `business`    INTEGER NOT NULL,
  `uid`         INTEGER NOT NULL,
  `data_folder` TEXT    NOT NULL,
  `properties`  TEXT,
  PRIMARY KEY (`business`, `uid`)
);
CREATE INDEX IF NOT EXISTS `HG_ACCOUNTS.business_idx` ON `HG_ACCOUNTS` (`business`);
CREATE INDEX IF NOT EXISTS `HG_ACCOUNTS.uid_idx`      ON `HG_ACCOUNTS` (`uid`);

CREATE TABLE IF NOT EXISTS `HG_GACHA_RECORDS` (
  `business`   INTEGER NOT NULL,
  `uid`        INTEGER NOT NULL,
  `id`         TEXT    NOT NULL,
  `gacha_type` INTEGER NOT NULL,
  `gacha_id`   INTEGER,
  `rank_type`  INTEGER NOT NULL,
  `count`      INTEGER NOT NULL,
  `time`       TEXT    NOT NULL,
  `lang`       TEXT    NOT NULL,
  `name`       TEXT    NOT NULL,
  `item_type`  TEXT    NOT NULL,
  `item_id`    TEXT    NOT NULL,
  PRIMARY KEY (`business`, `uid`, `id`)
);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.id_idx`                      ON `HG_GACHA_RECORDS` (`id`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.gacha_type_idx`              ON `HG_GACHA_RECORDS` (`gacha_type`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.rank_type_idx`               ON `HG_GACHA_RECORDS` (`rank_type`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.business_uid_idx`            ON `HG_GACHA_RECORDS` (`business`, `uid`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.business_uid_gacha_type_idx` ON `HG_GACHA_RECORDS` (`business`, `uid`, `gacha_type`);

PRAGMA USER_VERSION = 1;
COMMIT TRANSACTION;
