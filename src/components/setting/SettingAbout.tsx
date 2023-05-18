import React from 'react'
import Version from '@/components/common/Version'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'

// TODO: Version check

export default function SettingAbout () {
  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">版本</Typography>
        <Typography component="p" variant="body2">
          <Version variant="inherit" format={(ver) => `当前版本：v${ver}`} />
          &nbsp;&nbsp;
          <Button size="small" disabled>检查更新</Button>
          <br />
          {'开源地址：'}
          <Link href={__APP_REPOSITORY__} target="_blank" rel="noreferrer">
            {__APP_REPOSITORY__}
          </Link>
        </Typography>
      </Stack>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">信息</Typography>
        <Typography component="p" variant="body2">
          <Typography component="span" color="error.light">HoYo.Gacha</Typography>
          &nbsp;
          {'一个非官方的工具，用于管理和分析你的 miHoYo 抽卡记录。'}
          {'使用 '}
          <Link href="https://tauri.app" rel="noreferrer">Tauri</Link>
          {'、'}
          <Link href="https://reactjs.org" rel="noreferrer">React</Link>
          {'、'}
          <Link href="https://rust-lang.org" rel="noreferrer">Rust</Link>
          {' 和 '}
          <Link href="https://mui.com" rel="noreferrer">MUI</Link>
          {' 框架开发。'}
          <br />
          {'本软件不会收集任何用户数据。所产生的数据（包括但不限于使用数据、抽卡数据、账号信息等）均保存在用户本地。'}
          <br />
          {'软件的部分图片资源来源于「原神」、「崩坏：星穹铁道」©miHoYo 上海米哈游影铁科技有限公司 版权所有。'}
          <br />
          {'软件使用的字体资源「汉仪文黑-85W」©北京汉仪创新科技股份有限公司 版权所有。'}
          <br />
          {'代码完全开源。仅供个人学习交流使用。请勿用于任何商业或违法违规用途。'}
          <br />
        </Typography>
      </Stack>
    </Stack>
  )
}
