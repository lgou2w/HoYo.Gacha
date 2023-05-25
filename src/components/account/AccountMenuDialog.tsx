import React from "react";
import { dialog } from "@tauri-apps/api";
import { useForm, SubmitHandler } from "react-hook-form";
import { Account, AccountFacet } from "@/interfaces/account";
import {
  useCreateAccountFn,
  useUpdateAccountGameDataDirFn,
  useUpdateAccountPropertiesFn,
  useDeleteAccountFn,
} from "@/hooks/useStatefulAccount";
import PluginGacha from "@/utilities/plugin-gacha";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import LabelIcon from "@mui/icons-material/Label";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import PanToolAltIcon from "@mui/icons-material/PanToolAlt";
import DeleteIcon from "@mui/icons-material/Delete";

export interface AccountMenuDialogProps {
  mode: "add" | "edit";
  open: boolean;
  facet: AccountFacet;
  accounts: Record<Account["uid"], Account>;
  editAccountUid?: Account["uid"];
  onClose?: () => void;
}

export default function AccountMenuDialog(props: AccountMenuDialogProps) {
  const { mode, open, facet, accounts, editAccountUid, onClose } = props;
  const [busy, setBusy] = React.useState(false);
  const deleteAccount = useDeleteAccountFn();
  const handleDeleteAccount = React.useCallback(async () => {
    if (editAccountUid) {
      setBusy(true);
      try {
        await deleteAccount(editAccountUid);
        onClose?.();
      } catch (e) {
        // TODO: handle error
        console.error(e);
      } finally {
        setBusy(false);
      }
    }
  }, [editAccountUid, setBusy, deleteAccount, onClose]);

  const id = "account-menu-dialog-form";
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle display="flex" alignItems="center">
        {mode === "add" ? "Add Account" : "Edit Account"}
        {mode === "edit" && (
          <Tooltip
            placement="left"
            title={
              <React.Fragment>
                <Typography variant="body1">Delete Account</Typography>
                <Typography variant="caption">
                  Note: Stored data will not be cleard for this account.
                </Typography>
              </React.Fragment>
            }
            arrow
          >
            <Box marginLeft="auto">
              <IconButton
                color="error"
                onClick={handleDeleteAccount}
                disabled={busy}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </DialogTitle>
      <DialogContent dividers>
        <AccountMenuDialogForm
          id={id}
          mode={mode}
          facet={facet}
          accounts={accounts}
          editAccountUid={editAccountUid}
          busy={busy}
          setBusy={setBusy}
          onSuccess={onClose}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error" disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" form={id} disabled={busy}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface IFormInput {
  uid: string;
  displayName?: string; // -> Account['properties']['displayName']
  gameDataDir: string;
}

interface AccountMenuDialogFormProps {
  id: string;
  mode: AccountMenuDialogProps["mode"];
  facet: AccountMenuDialogProps["facet"];
  accounts: AccountMenuDialogProps["accounts"];
  editAccountUid?: AccountMenuDialogProps["editAccountUid"];
  busy: boolean;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess?: () => void;
}

function AccountMenuDialogForm(props: AccountMenuDialogFormProps) {
  const {
    mode,
    id,
    facet,
    accounts,
    editAccountUid,
    busy,
    setBusy,
    onSuccess,
  } = props;

  const editAccount = editAccountUid ? accounts[editAccountUid] : null;
  const {
    register,
    setValue,
    setError,
    formState: { errors },
    handleSubmit,
  } = useForm<IFormInput>({
    values: editAccount
      ? {
          uid: editAccount.uid,
          gameDataDir: editAccount.gameDataDir,
          displayName: editAccount.properties?.displayName ?? undefined,
        }
      : undefined,
  });

  const isEdit = mode === "edit";
  const createAccount = useCreateAccountFn();
  const updateAccountProperties = useUpdateAccountPropertiesFn();
  const updateAccountGameDataDir = useUpdateAccountGameDataDirFn();

  const handleGameDataDirAutoFind = React.useCallback(() => {
    PluginGacha.findGameDataDirectories(facet)
      .then((value) => {
        if (value.length >= 1) {
          // TODO: Multi select for Game data dir
          setValue("gameDataDir", value[0]);
        } else {
          setError("gameDataDir", {
            message: "No valid game data folder found!",
          });
        }
      })
      .catch((error) => {
        setError("gameDataDir", {
          message:
            error instanceof Error || typeof error === "object"
              ? error.message
              : error,
        });
      });
  }, [facet, setValue, setError]);

  const handleGameDataDirManualOpen = React.useCallback(() => {
    dialog
      .open({
        title: "Please select the game data folder:",
        directory: true,
        multiple: false,
      })
      .then((result) => {
        if (typeof result === "string") {
          result = result.replace(/\\/g, "/");
          setValue("gameDataDir", result);
        }
      })
      .catch((error) => {
        setError("gameDataDir", {
          message:
            error instanceof Error || typeof error === "object"
              ? error.message
              : error,
        });
      });
  }, [setValue, setError]);

  const handleCreateAccount = React.useCallback(
    async (uid: number, data: IFormInput) => {
      if (accounts[uid]) {
        setError("uid", { message: "This account UID already exists!" });
        return Promise.resolve();
      }

      // TODO: Account properties customization
      const properties: Account["properties"] = data.displayName
        ? { displayName: data.displayName }
        : null;

      await createAccount({
        uid: String(uid),
        gameDataDir: data.gameDataDir,
        gachaUrl: null,
        properties,
      });
    },
    [accounts, setError, createAccount]
  );

  const handleUpdateAccount = React.useCallback(
    async (uid: number, data: IFormInput) => {
      // TODO: Optimize to once update
      const editAccount = accounts[uid];
      await updateAccountGameDataDir(facet, editAccount.uid, data.gameDataDir);
      await updateAccountProperties(facet, editAccount.uid, {
        ...editAccount.properties,
        displayName: data.displayName ?? null,
      });
    },
    [accounts, updateAccountProperties, updateAccountGameDataDir]
  );

  const onSubmit = React.useCallback<SubmitHandler<IFormInput>>(
    async (data) => {
      const uid = Number(data.uid);
      if (uid < 1_0000_0000) {
        setError("uid", { message: "Please enter the correct UID value!" });
        return;
      }

      setBusy(true);
      try {
        !isEdit
          ? await handleCreateAccount(uid, data)
          : await handleUpdateAccount(uid, data);
        onSuccess?.();
      } catch (e) {
        setError("uid", {
          message:
            e instanceof Error || typeof e === "object"
              ? (e as Error).message
              : String(e),
        });
      } finally {
        setBusy(false);
      }
    },
    [
      setBusy,
      onSuccess,
      setError,
      isEdit,
      handleCreateAccount,
      handleUpdateAccount,
    ]
  );

  return (
    <form
      id={id}
      onSubmit={handleSubmit(onSubmit)}
      autoComplete="off"
      noValidate
    >
      <TextField
        label="UID"
        placeholder="Account UID"
        variant="filled"
        size="small"
        margin="dense"
        fullWidth
        required
        disabled={isEdit || busy}
        error={!!errors.uid}
        helperText={errors.uid?.message}
        InputProps={{
          ...register("uid", {
            required: "Please fill in the account UID field!",
            validate: (value) =>
              /\d+/.test(value) || "Please enter the correct UID value!",
          }),
          onKeyPress: numericOnly,
          startAdornment: (
            <InputAdornment position="start">
              <PermIdentityIcon />
            </InputAdornment>
          ),
        }}
      />
      <TextField
        label="Nickname"
        placeholder="custom nickname (optional)"
        variant="filled"
        size="small"
        margin="dense"
        fullWidth
        disabled={busy}
        error={!!errors.displayName}
        helperText={errors.displayName?.message}
        InputProps={{
          ...register("displayName", {
            validate: (value) =>
              value
                ? value.length <= 16 || "Nickname cannot exceed 16 characters!"
                : true,
          }),
          startAdornment: (
            <InputAdornment position="start">
              <LabelIcon />
            </InputAdornment>
          ),
        }}
      />
      <TextField
        name="gameDataDir"
        label="game data folder"
        type="text"
        placeholder={"For Example：" + FacetGameDataDirExamples[facet]}
        variant="filled"
        size="small"
        margin="dense"
        fullWidth
        required
        disabled={busy}
        error={!!errors.gameDataDir}
        helperText={errors.gameDataDir?.message}
        InputProps={{
          ...register("gameDataDir", {
            required: "Please select the game data directory!",
          }),
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start" sx={{ height: "100%" }}>
              <FolderOpenIcon />
            </InputAdornment>
          ),
        }}
      />
      <Stack direction="row" spacing={1} marginTop={1}>
        <Button
          variant="outlined"
          size="small"
          color="secondary"
          startIcon={<GpsFixedIcon />}
          onClick={handleGameDataDirAutoFind}
          disabled={busy}
        >
          Auto Search
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="success"
          startIcon={<PanToolAltIcon />}
          onClick={handleGameDataDirManualOpen}
          disabled={busy}
        >
          Manual Selection
        </Button>
      </Stack>
    </form>
  );
}

const FacetGameDataDirExamples: Record<AccountFacet, string> = {
  [AccountFacet.Genshin]: "D:/Genshin Impact/Genshin Impact Game/YuanShen_Data",
  [AccountFacet.StarRail]: "D:/StarRail/Game/StarRail_Data",
};

function numericOnly(evt: React.KeyboardEvent<HTMLElement>) {
  const keyCode = evt.which ? evt.which : evt.keyCode;
  if (keyCode > 31 && (keyCode < 48 || keyCode > 57) && keyCode !== 46) {
    evt.preventDefault();
  }
}
