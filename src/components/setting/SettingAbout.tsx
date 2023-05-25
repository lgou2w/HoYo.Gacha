import React from "react";
import Version from "@/components/common/Version";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";

// TODO: Version check

export default function SettingAbout() {
  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">
          Version
        </Typography>
        <Typography component="p" variant="body2">
          <Version
            variant="inherit"
            format={(ver) => `current version：v${ver}`}
          />
          &nbsp;&nbsp;
          <Button size="small" disabled>
            Check for updates
          </Button>
          <br />
          {"Open source address:"}
          <Link href={__APP_REPOSITORY__} target="_blank" rel="noreferrer">
            {__APP_REPOSITORY__}
          </Link>
        </Typography>
      </Stack>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">
          information
        </Typography>
        <Typography component="p" variant="body2">
          <Typography component="span" color="error.light">
            Gacha Tracker{" "}
          </Typography>
          &nbsp;
          {"An unofficial tool to manage and analyze your miHoYo draw records."}
          {"use "}
          <Link href="https://tauri.app" target="_blank" rel="noreferrer">
            Tauri
          </Link>
          {"、"}
          <Link href="https://reactjs.org" target="_blank" rel="noreferrer">
            React
          </Link>
          {"、"}
          <Link href="https://rust-lang.org" target="_blank" rel="noreferrer">
            Rust
          </Link>
          {" 和 "}
          <Link href="https://mui.com" target="_blank" rel="noreferrer">
            MUI
          </Link>
          {" Framework development."}
          <br />
          {
            "This software does not collect any user data. The generated data (including but not limited to usage data, card draw data, account information, etc.) are stored locally by the user."
          }
          <br />
          {`Some image resources of the software come from "Yuanshin", "Honkai: Star Railway" © miHoYo Shanghai Mihayouyingtie Technology Co., Ltd. All rights reserved`}
          <br />
          {`The font resource "Hanyiwenhei-85W" used by the software © Beijing Hanyi Innovation Technology Co., Ltd. All rights reserved.`}
          <br />
          {
            "The code is completely open source. For personal study and communication only. Do not use for any commercial or illegal purposes."
          }
          <br />
        </Typography>
      </Stack>
    </Stack>
  );
}
