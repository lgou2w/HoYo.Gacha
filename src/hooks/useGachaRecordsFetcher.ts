import React from "react";
import { event } from "@tauri-apps/api";
import { useImmer } from "use-immer";
import { GenshinGachaRecord, StarRailGachaRecord } from "@/interfaces/gacha";
import PluginGacha from "@/utilities/plugin-gacha";

type Fragment =
  | "sleeping"
  | { ready: string }
  | { pagination: number }
  | { data: Array<GenshinGachaRecord | StarRailGachaRecord> }
  | "finished";

export default function useGachaRecordsFetcher() {
  const [{ fragments, current }, produceState] = useImmer<{
    fragments: Fragment[];
    current: "idle" | Fragment;
  }>({
    fragments: [],
    current: "idle",
  });

  const pull = React.useCallback(
    async (...args: Parameters<typeof PluginGacha.pullAllGachaRecords>) => {
      // reset state
      produceState((draft) => {
        draft.fragments = [];
        draft.current = "idle";
      });

      const [, , { eventChannel }] = args;
      try {
        const unlisten = await event.listen<Fragment>(
          eventChannel,
          ({ payload }) => {
            produceState((draft) => {
              draft.fragments.push(payload);
              draft.current = payload;
            });
          }
        );

        try {
          await PluginGacha.pullAllGachaRecords(...args);
        } finally {
          unlisten();
        }
      } catch (error) {
        return Promise.reject(error);
      }
    },
    [produceState]
  );

  return {
    fragments,
    currentFragment: current,
    pull,
  };
}
