import React from 'react'
import { dialog, process } from '@tauri-apps/api'
import { useVersion, useLatestVersion, CurrentVersion, LatestVersion } from '@/components/common/useVersion'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import DownloadIcon from '@mui/icons-material/Download'
import invoke from '@/utilities/invoke'
import dayjs from '@/utilities/dayjs'

export default function VersionChecker() {
  const version = useVersion();
  const latestVersion = useLatestVersion();
  const [busy, setBusy] = React.useState(false);

  const handleUpdate = React.useCallback(async () => {
    const data = latestVersion.data;
    if (!data) return;

    const date = dayjs(data.created_at);
    const message = [
      "Update to new version?",
      "",
      `Version：v${data.tag_name}`,
      `Release Date：${date.format(
        "YYYY-MM-DD HH:mm:ss"
      )}（${date.fromNow()}）`,
      `Beta：${data.prerelease ? "Yes" : "No"}`,
    ].join("\n");

    await dialog.confirm(message, {
      title: "New Version Found",
      type: "info",
      okLabel: "OK",
      cancelLabel: "Cancel",
    });
  }, [latestVersion.data, setBusy]);

  if (!version.data) {
    return (
      <Typography component="span" variant="body2" color="warning">
        Update not available
      </Typography>
    );
  }

  if (latestVersion.isLoading)
    return (
      <Typography component="span" variant="body2">
        Loading...
      </Typography>
    );
  if (latestVersion.isError)
    return (
      <Typography component="span" variant="body2" color="error">
        Version check failed
      </Typography>
    );

  const needUpdate = isNeedUpdate(version.data, latestVersion.data)
  if (!needUpdate) return <Typography component="span" variant="body2" color="error">已是最新版本</Typography>

  return (
    <Button
      size="small"
      color="info"
      startIcon={<DownloadIcon fontSize="small" />}
      onClick={handleUpdate}
      disabled={busy}
    >
      {!busy ? "Update to new version" : "Download the latest version..."}
    </Button>
  );
}

function isNeedUpdate (
  version: CurrentVersion,
  latestVersion: LatestVersion | null
): boolean {
  if (!latestVersion) return false

  // TODO: Strictly compare semver
  const current = version.version
  const latest = latestVersion.tag_name
  const currentSemver = current.split('.').map(v => parseInt(v))
  const latestSemver = latest.split('.').map(v => parseInt(v))
  for (let i = 0; i < 3; i++) {
    if (currentSemver[i] < latestSemver[i]) return true
    if (currentSemver[i] > latestSemver[i]) return false
  }
  return false
}
