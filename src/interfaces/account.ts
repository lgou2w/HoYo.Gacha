/* eslint-disable no-multi-spaces */

// See: src-tauri/src/storage/entity_account.rs

export enum AccountFacet {
  Genshin = "genshin",
  StarRail = "starrail",
}

export interface KnownAccountProperties {
  displayName?: string | null;
  lastGachaUpdated?: string | null;
  [key: string]: unknown;
}

// #[serde(rename_all = "camelCase")]
export interface Account {
  id: number;
  facet: AccountFacet;
  uid: string;
  gameDataDir: string;
  gachaUrl: string | null;
  properties: KnownAccountProperties | null;
}

export function resolveAccountDisplayName(
  facet: AccountFacet,
  account: Account | null
): string {
  if (account && account.facet !== facet) {
    // HACK: strict check
    throw new Error(
      `Account facet mismatch: ${account.facet} (Expected: ${facet})`
    );
  }

  // TODO: Default display name i18n
  return (
    account?.properties?.displayName ||
    (facet === AccountFacet.Genshin
      ? "Traveler"
      : facet === AccountFacet.StarRail
      ? "Trailblazer"
      : "NULL")
  );
}

export interface Action {
  singular: string;
  plural: string;
}

// TODO: i18n
export function resolveCurrency(facet: AccountFacet): {
  currency: string;
  action: Action;
} {
  switch (facet) {
    case AccountFacet.Genshin:
      return {
        currency: "Primogems",
        action: { singular: "Wish", plural: "Wishes" },
      };
    case AccountFacet.StarRail:
      return {
        currency: "Stellar Jade",
        action: { singular: "Warp", plural: "Warps" },
      };
    default:
      throw new Error(`Unknown account facet: ${facet}`);
  }
}
