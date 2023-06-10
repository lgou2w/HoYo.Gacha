import React from "react";
import { useImmer } from "use-immer";
import { useStatefulAccountContext } from "@/hooks/useStatefulAccount";
import { useGachaRecordsQuery } from "@/hooks/useGachaRecordsQuery";
import { GachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import GachaToolbar from "@/components/gacha/toolbar";
import GachaOverview from "@/components/gacha/overview";
import GachaAnalysis from "@/components/gacha/analysis";
import GachaChart from "@/components/gacha/chart";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

export default function GachaLayout() {
  const { facet, accounts, selectedAccountUid } = useStatefulAccountContext();
  const {
    data: gachaRecords,
    isLoading,
    isError,
    error,
  } = useGachaRecordsQuery(facet, selectedAccountUid);

  // Layout state
  const [{ tab, alert }, produceState] = useImmer({
    tab: 0,
    alert: undefined as
      | {
          severity: "success" | "error";
          message: string;
        }
      | undefined,
  });

  // Check selected account
  const selectedAccount = selectedAccountUid
    ? accounts[selectedAccountUid]
    : null;
  if (!selectedAccount) {
    return (
      <Typography color="error">
        {Object.keys(accounts).length > 0
          ? "There are currently no selected accounts. Please select an account first!"
          : "There are no accounts available yet. Please add an account first!"}
      </Typography>
    );
  }

  // TODO: loading and error customization
  if (isLoading) return <Typography>Loading...</Typography>;
  if (isError)
    return (
      <Typography>
        {error instanceof Error ? error.message : String(error)}
      </Typography>
    );
  if (!gachaRecords) throw new Error("gachaRecords is null"); // never!

  return (
    <GachaLayoutContext.Provider
      value={{
        facet,
        selectedAccount,
        gachaRecords,
        alert(error, message) {
          // TODO: optimize error handling
          const severity = error ? "error" : "success";
          if (error && (error instanceof Error || typeof error === "object")) {
            const msg = (error as { message: string }).message;
            const identifier = (error as { identifier?: string }).identifier;
            let knownMessage = identifier
              ? KnownErrorIdentifiers[identifier]
              : undefined;
            if (knownMessage) {
              let index: number;
              if ((index = msg.indexOf(":")) !== -1) {
                knownMessage += msg.substring(index + 1);
              }
              if (identifier === "INTERNAL_CRATE") {
                knownMessage += msg;
              }
            }
            message = knownMessage || msg;
          } else if (error) {
            message = String(error);
          }

          produceState((draft) => {
            draft.alert = message ? { severity, message } : undefined;
          });
        },
      }}
    >
      {alert && (
        <Alert
          severity={alert.severity}
          onClose={() =>
            produceState((draft) => {
              draft.alert = undefined;
            })
          }
        >
          {alert?.message}
        </Alert>
      )}
      <GachaToolbar
        facet={facet}
        ActionTabsProps={{
          tabs: ["Overview", "Analysis", "Stats", "Catalog"],
          value: tab,
          onChange: (_, newValue) =>
            produceState((draft) => {
              draft.tab = newValue;
            }),
        }}
      />
      {
        {
          0: <GachaOverview />,
          1: <GachaAnalysis />,
          2: <GachaChart />,
          3: <iframe src="https://wiki.hoyolab.com/pc/hsr/home" />,
        }[tab]
      }
    </GachaLayoutContext.Provider>
  );
}

const KnownErrorIdentifiers: Record<string, string> = {
  INTERNAL_CRATE: "Internal error: ",
  ILLEGAL_GACHA_URL: "Invalid card draw link!",
  VACANT_GACHA_URL:
    "No valid draw card link found. Please try to open the card drawing history interface in the game!",
  TIMEOUTD_GACHA_URL:
    "The card draw link has expired. Please re-open the card drawing history interface in the game!",
  UIGF_OR_SRGF_MISMATCHED_UID:
    "The UIGF or SRGF data UID to be imported does not match the current account!",
  UIGF_OR_SRGF_INVALID_FIELD:
    "There are invalid fields in the UIGF or SRGF data to be imported!",
};
