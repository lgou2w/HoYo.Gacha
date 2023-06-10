/* eslint-disable no-use-before-define */

import React from "react";
import {
  QueryKey,
  FetchQueryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AccountFacet, Account, resolveCurrency } from "@/interfaces/account";
import { GenshinGachaRecord, StarRailGachaRecord } from "@/interfaces/gacha";
import PluginStorage from "@/utilities/plugin-storage";
import * as _ from "lodash";

type GachaRecord = GenshinGachaRecord | StarRailGachaRecord;

type GachaFilter = (record: GachaRecord) => boolean;

// Computed Gacha Records
// See below
export interface GachaRecords {
  readonly facet: AccountFacet;
  readonly uid: Account["uid"];
  readonly gachaTypeToCategoryMappings: Record<
    GachaRecord["gacha_type"],
    NamedGachaRecords["category"]
  >;
  readonly values: Partial<Record<GachaRecord["gacha_type"], GachaRecord[]>>;
  readonly namedValues: Record<
    NamedGachaRecords["category"],
    NamedGachaRecords
  >;
  readonly aggregatedValues: Omit<
    NamedGachaRecords,
    "category" | "categoryTitle" | "gachaType" | "lastEndId"
  >;
  readonly total: number;
  readonly oldestTimestamp?: GachaRecord["time"];
  readonly latestTimestamp?: GachaRecord["time"];
}

export interface NamedGachaRecords {
  category: "newbie" | "permanent" | "character" | "weapon";
  categoryTitle: string;
  gachaType: GachaRecord["gacha_type"];
  lastEndId?: GachaRecord["id"];
  values: GachaRecord[];
  total: number;
  firstTime?: GachaRecord["time"];
  lastTime?: GachaRecord["time"];
  metadata: {
    blue: GachaRecordsMetadata;
    purple: AdvancedGachaRecordsMetadata;
    golden: AdvancedGachaRecordsMetadata;
  };
}

export interface GachaRecordsMetadata {
  values: GachaRecord[];
  sum: number;
  sumPercentage: number;
}

export interface AdvancedGachaRecordsMetadata extends GachaRecordsMetadata {
  values: Array<GachaRecord & { usedPity: number; restricted?: true }>;
  sumAverage: number;
  sumRestricted: number;
  nextPity: number;
}

/// Query

const QueryPrefix = "gachaRecords";

const gachaRecordsQueryFn: FetchQueryOptions<GachaRecords | null>["queryFn"] =
  async (context) => {
    const [, facet, uid] = context.queryKey as [
      string,
      AccountFacet,
      Account["uid"] | null
    ];
    if (!uid) {
      return null;
    }

    const rawGachaRecords: GachaRecord[] = await PluginStorage.findGachaRecords(
      facet,
      { uid }
    );
    return computeGachaRecords(facet, uid, rawGachaRecords);
  };

function createQuery(
  facet: AccountFacet,
  uid: Account["uid"] | null
): FetchQueryOptions<GachaRecords | null> & { queryKey: QueryKey } {
  return {
    queryKey: [QueryPrefix, facet, uid],
    queryFn: gachaRecordsQueryFn,
    staleTime: Infinity,
    // cacheTime: Infinity // TODO: GachaRecords infinity cache time?
  };
}

export function useGachaRecordsQuery(
  facet: AccountFacet,
  uid: Account["uid"] | null
) {
  const query = createQuery(facet, uid);
  return useQuery({
    ...query,
    refetchOnWindowFocus: false,
  });
}

/// Hook

export function useRefetchGachaRecordsFn() {
  const queryClient = useQueryClient();
  return React.useCallback(
    async (facet: AccountFacet, uid: Account["uid"]) => {
      const query = createQuery(facet, uid);
      await queryClient.refetchQueries({
        queryKey: query.queryKey,
        exact: true,
      });
    },
    [queryClient]
  );
}

/// Private Compute Fn

function computeGachaRecords(
  facet: AccountFacet,
  uid: Account["uid"],
  data: GachaRecord[]
): GachaRecords {
  const total = data.length;
  const oldestTimestamp = _.first(data)?.time;
  const latestTimestamp = _.last(data)?.time;
  const values = data.reduce((acc, record) => {
    (acc[record.gacha_type] || (acc[record.gacha_type] = [])).push(record);
    return acc;
  }, {} as GachaRecords["values"]);

  const namedValues = computeNamedGachaRecords(facet, values);
  const aggregatedValues = computeAggregatedGachaRecords(
    facet,
    data,
    namedValues
  );
  const gachaTypeToCategoryMappings = Object.values(namedValues).reduce(
    (acc, prev) => {
      acc[prev.gachaType] = prev.category;
      return acc;
    },
    {} as GachaRecords["gachaTypeToCategoryMappings"]
  );

  return {
    facet,
    uid,
    total,
    gachaTypeToCategoryMappings,
    values,
    namedValues,
    aggregatedValues,
    oldestTimestamp,
    latestTimestamp,
  };
}

const KnownGenshinGachaTypes: Record<
  GenshinGachaRecord["gacha_type"],
  NamedGachaRecords["category"]
> = {
  100: "newbie",
  200: "permanent",
  301: "character", // include 400
  302: "weapon",
};

const KnownStarRailGachaTypes: Record<
  StarRailGachaRecord["gacha_type"],
  NamedGachaRecords["category"]
> = {
  2: "newbie",
  1: "permanent",
  11: "character",
  12: "weapon",
};

const KnownCategoryTitles: Record<
  AccountFacet,
  Record<NamedGachaRecords["category"], string>
> = {
  [AccountFacet.Genshin]: {
    character: "Character",
    weapon: "Weapon",
    permanent: "Standard",
    newbie: "Beginner",
  },
  [AccountFacet.StarRail]: {
    character: "Character",
    weapon: "Light Cone",
    permanent: "Regular",
    newbie: "Starter",
  },
};

const isRankTypeOfBlue = (record: GachaRecord) => record.rank_type === "3";
const isRankTypeOfPurple = (record: GachaRecord) => record.rank_type === "4";
const isRankTypeOfGolden = (record: GachaRecord) => record.rank_type === "5";
const sortGachaRecordById = (a: GachaRecord, b: GachaRecord) =>
  a.id.localeCompare(b.id);

function concatNamedGachaRecordsValues(
  facet: AccountFacet,
  values: GachaRecords["values"],
  gachaType: GachaRecord["gacha_type"],
  category: NamedGachaRecords["category"]
): GachaRecord[] {
  const data = values[gachaType] || [];
  if (facet === AccountFacet.Genshin && category === "character") {
    // HACK: Genshin Impact: 301 and 400 are the character gacha type
    return Array.from(data)
      .concat(values["400"] || [])
      .sort(sortGachaRecordById);
  } else {
    return Array.from(data);
  }
}

function computeNamedGachaRecords(
  facet: AccountFacet,
  values: GachaRecords["values"]
): GachaRecords["namedValues"] {
  const categories =
    facet === AccountFacet.Genshin
      ? KnownGenshinGachaTypes
      : KnownStarRailGachaTypes;
  const { action: currencyAction } = resolveCurrency(facet);

  return Object.entries(categories).reduce((acc, [gachaType, category]) => {
    const categoryTitle =
      KnownCategoryTitles[facet][category] + " " + currencyAction.singular;
    const data = concatNamedGachaRecordsValues(
      facet,
      values,
      gachaType,
      category
    );
    const total = data.length;
    const lastEndId = data[total - 1]?.id;
    const firstTime = data[0]?.time;
    const lastTime = data[total - 1]?.time;
    const metadata: NamedGachaRecords["metadata"] = {
      blue: computeGachaRecordsMetadata(total, data.filter(isRankTypeOfBlue)),
      purple: computeAdvancedGachaRecordsMetadata(
        facet,
        data,
        isRankTypeOfPurple
      ),
      golden: computeAdvancedGachaRecordsMetadata(
        facet,
        data,
        isRankTypeOfGolden
      ),
    };

    acc[category] = {
      category,
      categoryTitle,
      gachaType,
      lastEndId,
      total,
      firstTime,
      lastTime,
      values: data,
      metadata,
    };
    return acc;
  }, {} as GachaRecords["namedValues"]);
}

function computeAggregatedGachaRecords(
  facet: AccountFacet,
  data: GachaRecord[],
  namedValues: GachaRecords["namedValues"]
): GachaRecords["aggregatedValues"] {
  const total = data.length;
  const firstTime = data[0]?.time;
  const lastTime = data[total - 1]?.time;
  const { newbie, permanent, character, weapon } = namedValues;

  const blueSum =
    newbie.metadata.blue.sum +
    permanent.metadata.blue.sum +
    character.metadata.blue.sum +
    weapon.metadata.blue.sum;
  const blueSumPercentage =
    blueSum > 0 ? Math.round((blueSum / total) * 10000) / 100 : 0;
  const blueValues = data.filter(isRankTypeOfBlue);

  const purpleSum =
    newbie.metadata.purple.sum +
    permanent.metadata.purple.sum +
    character.metadata.purple.sum +
    weapon.metadata.purple.sum;
  const purpleSumPercentage =
    purpleSum > 0 ? Math.round((purpleSum / total) * 10000) / 100 : 0;
  const purpleValues = Array.from(newbie.metadata.purple.values)
    .concat(Array.from(permanent.metadata.purple.values))
    .concat(Array.from(character.metadata.purple.values))
    .concat(Array.from(weapon.metadata.purple.values))
    .sort(sortGachaRecordById);

  const { purpleUsedPitySum } = purpleValues.reduce(
    (acc, record) => {
      console.log("usedpity", record.usedPity);
      acc.purpleUsedPitySum += record.usedPity;
      return acc;
    },
    {
      purpleUsedPitySum: 0,
    }
  );

  const purpleSumAverage =
    purpleSum > 0
      ? Math.ceil(Math.round((purpleUsedPitySum / purpleSum) * 100) / 100)
      : 0;

  const goldenSum =
    newbie.metadata.golden.sum +
    permanent.metadata.golden.sum +
    character.metadata.golden.sum +
    weapon.metadata.golden.sum;
  const goldenSumPercentage =
    goldenSum > 0 ? Math.round((goldenSum / total) * 10000) / 100 : 0;
  const goldenValues = Array.from(newbie.metadata.golden.values)
    .concat(Array.from(permanent.metadata.golden.values))
    .concat(Array.from(character.metadata.golden.values))
    .concat(Array.from(weapon.metadata.golden.values))
    .sort(sortGachaRecordById);

  const { goldenSumRestricted, goldenUsedPitySum } = goldenValues.reduce(
    (acc, record) => {
      if (record.restricted) {
        acc.goldenSumRestricted += 1;
      }
      console.log("usedpitgy", record.usedPity);

      acc.goldenUsedPitySum += record.usedPity;
      return acc;
    },
    {
      goldenSumRestricted: 0,
      goldenUsedPitySum: 0,
    }
  );

  const goldenSumAverage =
    goldenSum > 0
      ? Math.ceil(Math.round((goldenUsedPitySum / goldenSum) * 100) / 100)
      : 0;

  return {
    total,
    firstTime,
    lastTime,
    values: data,
    metadata: {
      blue: {
        sum: blueSum,
        sumPercentage: blueSumPercentage,
        values: blueValues,
      },
      purple: {
        sum: purpleSum,
        sumPercentage: purpleSumPercentage,
        values: purpleValues,
        sumAverage: purpleSumAverage,
        sumRestricted: 0,
        nextPity: 0,
      },
      golden: {
        sum: goldenSum,
        sumPercentage: goldenSumPercentage,
        values: goldenValues,
        sumAverage: goldenSumAverage,
        sumRestricted: goldenSumRestricted,
        nextPity: 0,
      },
    },
  };
}

function computeGachaRecordsMetadata(
  total: number,
  values: GachaRecord[]
): GachaRecordsMetadata {
  const sum = values.length;
  const sumPercentage = sum > 0 ? Math.round((sum / total) * 10000) / 100 : 0;
  return {
    values,
    sum,
    sumPercentage,
  };
}

function computeAdvancedGachaRecordsMetadata(
  facet: AccountFacet,
  values: GachaRecord[],
  filter: GachaFilter
): AdvancedGachaRecordsMetadata {
  const result: AdvancedGachaRecordsMetadata["values"] = [];

  let sum = 0;
  let pity = 0;
  let usedPitySum = 0;
  let sumRestricted = 0;

  for (const record of values) {
    pity += 1;

    if (filter(record)) {
      const restricted = isRestrictedGolden(facet, record);
      const rest = Object.assign(
        { usedPity: pity, restricted },
        record
      ) as AdvancedGachaRecordsMetadata["values"][number];
      result.push(rest);

      sum += 1;
      usedPitySum += pity;
      pity = 0;
      if (restricted) {
        sumRestricted += 1;
      }
    }
  }

  const total = values.length;
  const sumPercentage = sum > 0 ? Math.round((sum / total) * 10000) / 100 : 0;
  const sumAverage =
    sum > 0 ? Math.ceil(Math.round((usedPitySum / sum) * 100) / 100) : 0;

  return {
    values: result,
    sum,
    sumPercentage,
    sumAverage,
    sumRestricted,
    nextPity: pity,
  };
}

function isRestrictedGolden(facet: AccountFacet, record: GachaRecord): boolean {
  switch (facet) {
    case AccountFacet.Genshin:
      return !KnownGenshinPermanentGoldenNames.includes(record.name);
    case AccountFacet.StarRail:
      return !KnownStarRailPermanentGoldenItemIds.includes(record.item_id);
    default:
      throw new Error(`Unknown facet: ${facet}`);
  }
}

// TODO: Genshin Impact and Honkai: Star Rail restricted golden
//   Temporary use of embedded resources

const KnownGenshinPermanentGoldenNames: string[] = [
  "琴",
  "迪卢克",
  "七七",
  "莫娜",
  "刻晴",
  "提纳里",
  "迪希雅",
  "风鹰剑",
  "天空之刃",
  "天空之傲",
  "狼的末路",
  "天空之脊",
  "和璞鸢",
  "天空之卷",
  "四风原典",
  "天空之翼",
  "阿莫斯之弓",
];

const KnownStarRailPermanentGoldenItemIds: string[] = [
  "1003",
  "1004",
  "1101",
  "1104",
  "1107",
  "1209",
  "1211",
  "23000",
  "23002",
  "23003",
  "23004",
  "23005",
  "23012",
  "23013",
];
