BEGIN TRANSACTION;
SAVEPOINT start_migration_v2;

ALTER TABLE `HG_GACHA_RECORDS` RENAME TO `HG_GACHA_RECORDS_OLD`;

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
  PRIMARY KEY (`business`, `uid`, `id`, `gacha_type`)
);

INSERT INTO `HG_GACHA_RECORDS`
  (`business`, `uid`, `id`, `gacha_type`, `gacha_id`,
  `rank_type`, `count`, `time`, `lang`, `name`, `item_type`, `item_id`)
SELECT
  `business`, `uid`, `id`, `gacha_type`, `gacha_id`,
  `rank_type`, `count`, `time`, `lang`, `name`, `item_type`, `item_id`
FROM `HG_GACHA_RECORDS_OLD`;

DROP TABLE `HG_GACHA_RECORDS_OLD`;

CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.id_idx`                      ON `HG_GACHA_RECORDS` (`id`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.gacha_type_idx`              ON `HG_GACHA_RECORDS` (`gacha_type`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.rank_type_idx`               ON `HG_GACHA_RECORDS` (`rank_type`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.business_uid_idx`            ON `HG_GACHA_RECORDS` (`business`, `uid`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.business_uid_gacha_type_idx` ON `HG_GACHA_RECORDS` (`business`, `uid`, `gacha_type`);

PRAGMA USER_VERSION = 2;

RELEASE start_migration_v2;
COMMIT TRANSACTION;
