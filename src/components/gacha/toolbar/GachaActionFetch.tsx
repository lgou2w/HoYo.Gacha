import React from "react";
import { useImmer } from "use-immer";
import { resolveCurrency } from "@/interfaces/account";
import {
  useUpdateAccountGachaUrlFn,
  useUpdateAccountPropertiesFn,
} from "@/hooks/useStatefulAccount";
import {
  GachaRecords,
  useRefetchGachaRecordsFn,
} from "@/hooks/useGachaRecordsQuery";
import { useGachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import useGachaRecordsFetcher from "@/hooks/useGachaRecordsFetcher";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Backdrop from "@mui/material/Backdrop";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import CachedIcon from "@mui/icons-material/Cached";

export default function GachaActionFetch() {
  const { selectedAccount, gachaRecords, alert } = useGachaLayoutContext();
  const { currentFragment, pull } = useGachaRecordsFetcher();
  const { action } = resolveCurrency(selectedAccount.facet);
  const updateAccountGachaUrl = useUpdateAccountGachaUrlFn();
  const updateAccountProperties = useUpdateAccountPropertiesFn();
  const refetchGachaRecords = useRefetchGachaRecordsFn();
  const [{ busy }, produceState] = useImmer({
    busy: false,
  });

  const handleFetch = React.useCallback(async () => {
    if (!selectedAccount.gachaUrl) {
      alert("Link not available! Please try to read the link first.");
      return;
    }

    produceState((draft) => {
      draft.busy = true;
    });

    const { facet, uid, gachaUrl } = selectedAccount;
    try {
      const {
        namedValues: { character, weapon, permanent, newbie },
      } = gachaRecords;
      await pull(facet, uid, {
        gachaUrl,
        gachaTypeAndLastEndIdMappings: {
          [character.gachaType]: character.lastEndId ?? null,
          [weapon.gachaType]: weapon.lastEndId ?? null,
          [permanent.gachaType]: permanent.lastEndId ?? null,
          [newbie.gachaType]: newbie.lastEndId ?? null,
        },
        eventChannel: "gachaRecords-fetcher-event-channel",
        saveToStorage: true,
      });
      await updateAccountProperties(facet, uid, {
        ...selectedAccount.properties,
        lastGachaUpdated: new Date().toISOString(),
      });
      await refetchGachaRecords(facet, uid);
      alert(null, "Record updated successfully!");
    } catch (e) {
      // TODO: optimize error handling
      const isTimeoutdGachaUrlError =
        e && (e instanceof Error || typeof e === "object")
          ? "identifier" in e && e.identifier === "TIMEOUTD_GACHA_URL"
          : false;

      if (isTimeoutdGachaUrlError) {
        await updateAccountGachaUrl(facet, uid, null);
      }
      alert(e);
    } finally {
      produceState((draft) => {
        draft.busy = false;
      });
    }
  }, [
    selectedAccount,
    gachaRecords,
    alert,
    pull,
    updateAccountGachaUrl,
    updateAccountProperties,
    refetchGachaRecords,
    produceState,
  ]);

  return (
    <Box display="inline-flex">
      <Button
        variant="outlined"
        color="primary"
        size="small"
        startIcon={<CachedIcon />}
        onClick={handleFetch}
        disabled={busy}
      >
        {`Update`}
      </Button>
      {busy && (
        <Backdrop
          open={busy}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: "rgba(0, 0, 0, 0.75)",
            color: "#efefef",
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center">
            <CircularProgress color="info" />
            <Typography variant="h6" color="#efefef" sx={{ marginTop: 2 }}>
              {`Retrieving latest ${action.plural.toLocaleLowerCase()}...`}
            </Typography>
            <Typography variant="body1" sx={{ marginTop: 1 }}>
              {stringifyFragment(gachaRecords, currentFragment)}
            </Typography>
          </Box>
        </Backdrop>
      )}
    </Box>
  );
}

function stringifyFragment(
  gachaRecords: GachaRecords,
  fragment: ReturnType<typeof useGachaRecordsFetcher>["currentFragment"]
): string {
  if (fragment === "idle") {
    return "idle...";
  } else if (fragment === "sleeping") {
    return "Waiting...";
  } else if (fragment === "finished") {
    return "Finish";
  } else if ("ready" in fragment) {
    const gachaType = fragment.ready;
    const category = gachaRecords.gachaTypeToCategoryMappings[gachaType];
    const categoryTitle = gachaRecords.namedValues[category].categoryTitle;
    return `Fetching data for ${categoryTitle}`;
  } else if ("pagination" in fragment) {
    const pagination = fragment.pagination;
    return `Page ${pagination}...`;
  } else if ("data" in fragment) {
    const data = fragment.data;
    return `Found ${data.length} new...`;
  } else {
    // Should never reach here
    return `Unknown fragment: ${JSON.stringify(fragment)}`;
  }
}
