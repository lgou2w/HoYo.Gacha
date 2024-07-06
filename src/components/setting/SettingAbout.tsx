import React from 'react'
import Version from '@/components/common/Version'
import VersionChecker from '@/components/common/VersionChecker'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'

export default function SettingAbout () {
  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">版本</Typography>
        <Typography component="p" variant="body2">
          {'开源地址：'}
          <Link href={__APP_REPOSITORY__} target="_blank" rel="noreferrer">
            {__APP_REPOSITORY__}
          </Link>
          <br />
          当前版本：<Version variant="inherit" />
          &nbsp;
          <VersionChecker />
        </Typography>
      </Stack>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">信息</Typography>
        <Typography component="p" variant="body2">
          <Typography component="span" color="error.light">HoYo.Gacha</Typography>
          &nbsp;
          {'一个非官方的工具，用于管理和分析你的 miHoYo 抽卡记录。'}
          {'使用 '}
          <Link href="https://tauri.app" target="_blank" rel="noreferrer">Tauri</Link>
          {'、'}
          <Link href="https://reactjs.org" target="_blank" rel="noreferrer">React</Link>
          {'、'}
          <Link href="https://rust-lang.org" target="_blank" rel="noreferrer">Rust</Link>
          {' 和 '}
          <Link href="https://mui.com" target="_blank" rel="noreferrer">MUI</Link>
          {' 框架开发。'}
          <br />
          <br />
          <Typography>
            {'本软件不会向您索要任何关于 ©miHoYo 账户的账号密码信息，也不会收集任何用户数据。所产生的数据（包括但不限于使用数据、抽卡数据、UID 信息等）均保存在用户本地。'}
            {'软件的部分图片资源来源于「原神」、「崩坏：星穹铁道」、「绝区零」©miHoYo 上海米哈游影铁科技有限公司 版权所有。'}
            {'软件使用的字体资源「汉仪文黑-85W」©北京汉仪创新科技股份有限公司 版权所有。'}
            {'代码完全开源。仅供个人学习交流使用。请勿用于任何商业或违法违规用途。'}
          </Typography>
        </Typography>
      </Stack>
    </Stack>
  )
}
