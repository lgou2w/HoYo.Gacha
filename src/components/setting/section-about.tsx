import React from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ExternalLink from '@/components/common/external-link'

export default function SettingSectionAbout () {
  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">版本</Typography>
        <Typography component="p" variant="body2">
          {`当前版本：v${__APP_VERSION__}`}
          &nbsp;&nbsp;
          <Button size="small">检查更新</Button>
          <br />
          {'开源地址：'}
          <ExternalLink href="https://github.com/lgou2w/genshin-gacha" />
        </Typography>
      </Stack>
      <Stack gap={1}>
        <Typography component="h3" variant="body1">信息</Typography>
        <Typography component="p" variant="body2">
          <Typography component="span" color="error.light">Genshin Gacha</Typography>
          &nbsp;
          {'管理和分析你的原神祈愿记录。'}
          {'使用 '}
          <ExternalLink href="https://tauri.app">Tauri</ExternalLink>
          {'、'}
          <ExternalLink href="https://reactjs.org">React</ExternalLink>
          {'、'}
          <ExternalLink href="https://rust-lang.org">Rust</ExternalLink>
          {' 和 '}
          <ExternalLink href="https://mui.com">MUI</ExternalLink>
          {' 框架开发。'}
          <br />
          {'本软件不会收集任何用户数据。所产生的数据（包括但不限于使用数据、祈愿数据、账号信息等）均保存在用户本地。'}
          <br />
          {'软件的部分图片资源来源于「原神」©miHoYo 上海米哈游影铁科技有限公司 版权所有。'}
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
