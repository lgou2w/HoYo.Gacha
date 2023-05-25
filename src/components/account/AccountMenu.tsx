import React from "react";
import { useImmer } from "use-immer";
import { resolveAccountDisplayName } from "@/interfaces/account";
import { useStatefulAccountContext } from "@/hooks/useStatefulAccount";
import AccountAvatar from "@/components/account/AccountAvatar";
import AccountMenuDrawer from "@/components/account/AccountMenuDrawer";
import AccountMenuDialog, {
  AccountMenuDialogProps,
} from "@/components/account/AccountMenuDialog";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function AccountMenu() {
  const { facet, accounts, selectedAccountUid } = useStatefulAccountContext();
  const selectedAccount = selectedAccountUid
    ? accounts[selectedAccountUid]
    : null;
  const displayName = resolveAccountDisplayName(facet, selectedAccount);
  const [{ drawer, dialog }, produceState] = useImmer({
    drawer: false,
    dialog: {
      open: false,
      editAccountUid: undefined as AccountMenuDialogProps["editAccountUid"],
    },
  });

  return (
    <React.Fragment>
      <Button
        onClick={() =>
          produceState((draft) => {
            draft.drawer = true;
          })
        }
      >
        <AccountAvatar facet={facet} />
        <Stack direction="column" marginX={1} textAlign="left">
          <Typography variant="body2" textTransform="none" gutterBottom>
            {displayName}
          </Typography>
          <Typography variant="caption" lineHeight={1} textTransform="none">
            {selectedAccount?.uid || "NULL UID"}
          </Typography>
        </Stack>
      </Button>
      <AccountMenuDrawer
        title="Account Management"
        open={drawer}
        accounts={accounts}
        selectedAccountUid={selectedAccountUid}
        onClose={() =>
          produceState((draft) => {
            draft.drawer = false;
          })
        }
        onClickAddAccount={() => {
          produceState((draft) => {
            draft.dialog = { open: true, editAccountUid: undefined };
          });
        }}
        onClickEditAccount={(evt) => {
          const editAccountUid = evt.currentTarget.value;
          produceState((draft) => {
            draft.dialog = { open: true, editAccountUid };
          });
        }}
      />
      <AccountMenuDialog
        mode={dialog.editAccountUid ? "edit" : "add"}
        open={dialog.open}
        facet={facet}
        accounts={accounts}
        editAccountUid={dialog.editAccountUid}
        onClose={() =>
          produceState((draft) => {
            draft.dialog.open = false;
          })
        }
      />
    </React.Fragment>
  );
}
