import React from "react";
import { useImmer } from "use-immer";
import { clipboard } from "@tauri-apps/api";
import { resolveCurrency } from "@/interfaces/account";
import { useUpdateAccountGachaUrlFn } from "@/hooks/useStatefulAccount";
import { useGachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import PluginGacha from "@/utilities/plugin-gacha";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LinkIcon from "@mui/icons-material/Link";
import AddLinkIcon from "@mui/icons-material/AddLink";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function GachaActionUrl() {
  const { selectedAccount, alert } = useGachaLayoutContext();
  const { action } = resolveCurrency(selectedAccount.facet);
  const updateAccountGachaUrl = useUpdateAccountGachaUrlFn();
  const [{ busy }, produceState] = useImmer({
    busy: false,
  });

  const handleFindGachaUrl = React.useCallback(async () => {
    produceState((draft) => {
      draft.busy = true;
    });

    const { facet, uid, gameDataDir, gachaUrl } = selectedAccount;
    try {
      const newGachaUrl = await PluginGacha.findGachaUrl(
        facet,
        uid,
        gameDataDir
      );
      // const newGachaUrl =
      //   "https://webstatic-sea.hoyoverse.com/genshin/event/e20190909gacha-v2/index.html?win_mode=fullscreen&authkey_ver=1&sign_type=2&auth_appid=webview_gacha&init_type=301&gacha_id=89755dc7cbe9a8c2a6c48fc0f2c3992e9b2d590e&timestamp=1684884838&lang=en&device_type=pc&game_version=OSRELWin3.7.0_R14937036_S14962190_D15063751&plat_type=pc&region=os_usa&authkey=yyWiX7aE4nqim1sWgBG9%2f0R9n7aeFIYChfqdOs3jxRnPb%2bKj%2bCpYFf%2bxucXKTEr%2bW%2b8m44KHSvaeUWKUf4DuG0bqNy%2baj5wTfQEjwwlQwjCyeb2Ox30XxcoS9NbKPgDloqyqVpZfCrUM%2bbEPNSNljSzUCSiT6ZCSfRfLmXaBtPMk%2baBj6JTIvVd9HZXDDOoIIDjM0ebuZAk1dMflhLiewcxM0%2f2%2fYoYb5XdV6ajoUrWjvOo96UIJW2sO%2bj6jsDIN4H2wERQUrN3Y0Vkn8pF98OHxdhR4Whxs%2b1%2fhbp0upqIuk1cn9XQCylgVPAX9tguYarFYbHDf1B8w2IQKDeuPh38y%2fG3EOkXq783BttMrR3hudyXcdU0lgNZ1dRJdB4udvyfGfPBuKGn%2bShGjLECKhJ0ClDZMR8ir41ezyChpt5whbuXcMoG%2bc87yYbe3nzaYkkGo1HyopZ4S9IHkldekf%2fLRozTuKs9AZeBsjXybp6nfTJse6O6qiKbu%2f3rCxsEBcJNJTldzdmtGvNLefnZDmpOsobm%2bANPuukkRzumNzeOBTfOt9Qvn2zLuRSwHPeMCZ49pNiGGCw4fm%2f2m%2bbuyMb%2fFEh5J3qOogccADoJP0r4DWOdUBa891R39rCHAvFVCZp4dJbl7TY4ro2LnPDvbgMc5wm3yTkdjcqgB2MjxjsE9%2bdMi%2bHTdHzMeoTUWMKvpT1WXVE7523yWcFcdfuqouEEzrL4dAllaC%2b4EmEEhcATXSESghD5fHUROCVNnZ6fivfdkNuXFJmvFf7hzprF0AUOggGPH55KR3Lua2AaoCMQbbx4fEKINzVIz4mvN67%2b3UA1kjnjT92I4a1s7LfhgxLnG%2fWGX8s6PtIUSiSdfxcKQb2kvolQVv%2b1WlAfT1XhNvYZ%2fPtgPz2mvoFDkSe%2f54fBWGTTo6sAhMWueyw8Br2mcxuG5Z7vAgF%2baqsGYvS9DZ2%2brQqiR6SjEgKEdOV6EGmKhXsUJUQCGnL6MuTu6CX%2f1Gd%2fXHtQZ6Ew5fMm6h%2bTGEf%2fpNnK%2bpHSMDWUyWxwHZNRk1HdnYueE5MebSi2biSdCLa7F3b3pSCKutguPm7QVkQO2Wb1Rmk44wuMSzJMpoXymqRQT5lNJ8ski4OAKZj3WdG1NFZnAk27ORXk43IALUVeX3Ijw5%2b3aRt0uaLudH8ZJ1pBLAb4ODmtG1N%2b7eoe9TNzwKZrgyBd8Cn5dZ7YBxf2uxABJmYS9Cbs2w0sBAmQH0RpVx6qpdyGj47RGiXJoAN2ObgYGMhFAMmWDx8Q9QIQpEDFnnoJ1cXBb2mzedJEyMb5w6UvvVKIJCsTKtNJUOEyWxQIsbhsrIq8z4%2bLNa4%2fL6b%2bUog95z6kMFYxiyg%3d%3d&game_biz=";
      if (newGachaUrl !== gachaUrl) {
        // Update gacha url only if it's changed
        await updateAccountGachaUrl(facet, uid, newGachaUrl);
      }
      alert(null, "Read the link successfully!");
    } catch (e) {
      alert(e);
    } finally {
      produceState((draft) => {
        draft.busy = false;
      });
    }
  }, [selectedAccount, alert, updateAccountGachaUrl, produceState]);

  const handleCopyGachaUrl = React.useCallback(async () => {
    if (!selectedAccount.gachaUrl) {
      alert("Link not available! Please try to read the link first.");
    } else {
      try {
        await clipboard.writeText(selectedAccount.gachaUrl);
        alert(null, "Link copied to clipboard!");
      } catch (e) {
        alert(e);
      }
    }
  }, [selectedAccount, alert]);

  return (
    <Stack direction="row" gap={2}>
      <TextField
        variant="outlined"
        size="small"
        label={`${action}Link`}
        placeholder={`${action}Link`}
        value={selectedAccount.gachaUrl || ""}
        sx={{ maxWidth: 200 }}
        InputProps={{
          readOnly: true,
          sx: { paddingX: 1 },
          startAdornment: (
            <InputAdornment position="start">
              <LinkIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleCopyGachaUrl}
                disabled={busy}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        startIcon={<AddLinkIcon />}
        onClick={handleFindGachaUrl}
        disabled={busy}
      >
        read link
      </Button>
    </Stack>
  );
}
