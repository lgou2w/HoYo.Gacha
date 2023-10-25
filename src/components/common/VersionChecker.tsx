import React from 'react'
import { dialog, process } from '@tauri-apps/api'
import { useVersion, useLatestVersion, CurrentVersion, LatestVersion } from '@/components/common/useVersion'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import DownloadIcon from '@mui/icons-material/Download'
import invoke from '@/utilities/invoke'
import dayjs from '@/utilities/dayjs'

export default function VersionChecker () {
  const version = useVersion()
  const latestVersion = useLatestVersion()
  const [busy, setBusy] = React.useState(false)

  const handleUpdate = React.useCallback(async () => {
    const data = latestVersion.data
    if (!data) return

    const date = dayjs(data.created_at)
    const message = [
      '是否更新至新版本？',
      '',
      `版本名称：v${data.tag_name}`,
      `发布日期：${date.format('YYYY-MM-DD HH:mm:ss')}（${date.fromNow()}）`,
      `是否预览：${data.prerelease ? '是' : '否'}`
    ].join('\n')

    const confirmed = await dialog.confirm(message, {
      title: '版本更新',
      type: 'info',
      okLabel: '确定',
      cancelLabel: '取消'
    })
    if (!confirmed) return

    setBusy(true)
    invoke<void>('update_app', { latestVersion: data })
      .then(async () => {
        await dialog.message('新版本下载完成，请手动重启应用！', { title: '版本更新', type: 'info' })
        process.exit(0)
      })
      .catch(async (e) => {
        console.error(e)
        await dialog.message(`新版本下载失败：\n\n${e.message}`, { title: '版本更新', type: 'error' })
        setBusy(false)
      })
  }, [latestVersion.data, setBusy])

  if (!version.data) {
    return <Typography component="span" variant="body2" color="warning">版本更新不可用</Typography>
  }

  if (latestVersion.isLoading) return <Typography component="span" variant="body2">加载中...</Typography>
  if (latestVersion.isError) return <Typography component="span" variant="body2" color="error">检查最新版本失败</Typography>

  const needUpdate = isNeedUpdate(version.data, latestVersion.data)
  if (!needUpdate) return <Typography component="span" variant="body2" color="error">已是最新版本</Typography>

  return (
    <Button size="small" color="info"
      startIcon={<DownloadIcon fontSize="small" />}
      onClick={handleUpdate}
      disabled={busy}
    >
      {!busy ? '更新至新版本' : '下载最新版本中...'}
    </Button>
  )
}

function isNeedUpdate (
  version: CurrentVersion,
  latestVersion: LatestVersion | null | undefined
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
