import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import Version from '@/components/common/Version'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import StorageIcon from '@mui/icons-material/Storage'
import InfoIcon from '@mui/icons-material/Info'
import Logo from '@/assets/images/Logo.png'
import { shell } from '@tauri-apps/api'
import invoke from '@/utilities/invoke'

const BoxShieldsSx = {
  display: 'flex',
  alignItems: 'center',
  '& > img': {
    maxWidth: '150px',
    height: '20px',
    width: 'auto',
    marginRight: 1
  }
}

const BoxUlSx = {
  '& > ul': { paddingLeft: 2.5 },
  '& > ul li': { marginTop: 1 }
}

const DividerSx = {
  '&': {
    fontSize: '1.15rem',
    fontWeight: 500
  },
  '&:before': {
    width: '1%'
  }
}

export default function Index () {
  const handleClickOpenDatabaseDir = React.useCallback(async () => {
    const currentExeDir = await invoke<string>('get_current_exe_dir')
    await shell.open(currentExeDir)
  }, [])

  return (
    <Layout title="主页">
      <Typography variant="h5">
        <MuiLink href={__APP_REPOSITORY__} target="_blank" rel="noreferrer">
          HoYo.Gacha
        </MuiLink>
        &nbsp;&nbsp;
        <Version variant="caption" />
      </Typography>
      <Box sx={BoxShieldsSx}>
        <img src="https://img.shields.io/github/actions/workflow/status/lgou2w/HoYo.Gacha/build.yml?branch=main&logo=github&style=flat-square" alt="build status" />
        <img src="https://img.shields.io/github/v/release/lgou2w/HoYo.Gacha?logo=github&style=flat-square&include_prereleases" alt="latest release" />
        <Typography variant="caption">(Shields.io)</Typography>
      </Box>
      <Typography>一个非官方的工具，用于管理和分析你的 miHoYo 抽卡记录。</Typography>
      <Typography variant="body2">无需任何本地代理服务器。只需读取 Chromium 硬盘缓存文件并请求 API 端点。</Typography>
      <img height={128} width={128} src={Logo} />
      <Box sx={{
        ...BoxUlSx,
        '& > ul li code': {
          fontSize: '85%',
          fontWeight: 600,
          fontStyle: 'normal',
          fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace',
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
          borderRadius: '6px',
          padding: '0.2em 0.4em'
        }
      }}>
        <Divider textAlign="left" sx={DividerSx}>功能</Divider>
        <ul>
          <li>支持 <code>原神</code>、<code>崩坏：星穹铁道</code> 和 <code>绝区零</code> 游戏抽卡记录。</li>
          <li>管理游戏的多个账号。</li>
          <li>获取游戏的抽卡链接。</li>
          <li>
            {'获取抽卡记录并保存到本地数据库文件。 '}
            <Button
              startIcon={<StorageIcon />}
              variant="outlined"
              size="small"
              color="secondary"
              onClick={handleClickOpenDatabaseDir}
            >打开数据库目录</Button>
          </li>
          <li>
            {'实现 '}
            <MuiLink href="https://uigf.org/zh/standards/uigf.html" target="_blank" underline="hover">
              <code>UIGF</code>
            </MuiLink>
            {' 统一可交换祈愿记录标准。'}
          </li>
          <li>
            {'实现 '}
            <MuiLink href="https://uigf.org/zh/standards/srgf.html" target="_blank" underline="hover">
              <code>SRGF</code>
            </MuiLink>
            {' 星穹铁道抽卡记录标准'}
          </li>
          <li>更多开发中...</li>
        </ul>
      </Box>
      <Box sx={BoxUlSx}>
        <Divider textAlign="left" sx={DividerSx}>特别感谢</Divider>
        <ul>
          {[
            ['https://uigf.org/', 'UIGF organization'],
            ['https://github.com/vikiboss/gs-helper', 'vikiboss/gs-helper']
          ].map(([href, title], i) => (
            <li key={i}>
              <MuiLink href={href} target="_blank" underline="hover" fontSize="0.875rem">{title}</MuiLink>
            </li>
          ))}
        </ul>
      </Box>
      <Box>
        <Divider textAlign="left" sx={DividerSx}>协议</Divider>
        <Typography marginTop={1}>MIT OR Apache-2.0 仅供个人学习交流使用。请勿用于任何商业或违法违规用途。</Typography>
      </Box>
      <Box>
        <Button component={Link} to="/setting"
          variant="outlined"
          color="info"
          startIcon={<InfoIcon />}
        >
          关于
        </Button>
      </Box>
    </Layout>
  )
}
