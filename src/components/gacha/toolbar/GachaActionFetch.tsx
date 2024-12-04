import React, { MouseEventHandler } from 'react'
import { useImmer } from 'use-immer'
import { AccountFacet, resolveCurrency } from '@/interfaces/account'
import { useUpdateAccountGachaUrlFn, useUpdateAccountPropertiesFn } from '@/hooks/useStatefulAccount'
import { GachaRecords, NamedGachaRecords, useRefetchGachaRecordsFn } from '@/hooks/useGachaRecordsQuery'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import useGachaRecordsFetcher from '@/hooks/useGachaRecordsFetcher'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Backdrop from '@mui/material/Backdrop'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import AutoModeIcon from '@mui/icons-material/AutoMode'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CachedIcon from '@mui/icons-material/Cached'

export default function GachaActionFetch () {
  const { selectedAccount, gachaRecords, alert } = useGachaLayoutContext()
  const { currentFragment, pull } = useGachaRecordsFetcher()
  const { action } = resolveCurrency(selectedAccount.facet)
  const updateAccountGachaUrl = useUpdateAccountGachaUrlFn()
  const updateAccountProperties = useUpdateAccountPropertiesFn()
  const refetchGachaRecords = useRefetchGachaRecordsFn()
  const [{ busy, menu }, produceState] = useImmer({
    busy: false,
    menu: false
  })

  const menuRef = React.useRef<HTMLDivElement>(null)
  const handleToggleMenu = React.useCallback(() => {
    produceState((draft) => {
      draft.menu = !draft.menu
    })
  }, [produceState])

  const handleMenuClose = React.useCallback(() => {
    produceState((draft) => {
      draft.menu = false
    })
  }, [menuRef, produceState])

  const handleFetch = React.useCallback<MouseEventHandler>(async (evt) => {
    produceState((draft) => {
      draft.menu = false
    })

    if (!selectedAccount.gachaUrl) {
      alert('链接不可用！请先尝试读取链接。')
      return
    }

    produceState((draft) => {
      draft.busy = true
    })

    const fullAmount = Boolean(evt.currentTarget.getAttribute('data-full-amount'))
    const { facet, uid, gachaUrl } = selectedAccount
    try {
      const { namedValues: { character, weapon, permanent, newbie, anthology, bangboo } } = gachaRecords
      const pullNewbie = shouldPullNewbie(facet, newbie)
      const changes = await pull(facet, uid, {
        gachaUrl,
        gachaTypeAndLastEndIdMappings: {
          [character.gachaType]: character.lastEndId ?? null,
          [weapon.gachaType]: weapon.lastEndId ?? null,
          [permanent.gachaType]: permanent.lastEndId ?? null,
          ...(anthology ? { [anthology.gachaType]: anthology.lastEndId ?? null } : {}),
          ...(bangboo ? { [bangboo.gachaType]: bangboo.lastEndId ?? null } : {}),
          ...(pullNewbie || {})
        },
        eventChannel: 'gachaRecords-fetcher-event-channel',
        saveToStorage: true,
        fullAmount
      })
      await updateAccountProperties(facet, uid, {
        ...selectedAccount.properties,
        lastGachaUpdated: new Date().toISOString()
      })
      await refetchGachaRecords(facet, uid)

      let changesMessage: string
      if (changes >= 0) {
        changesMessage = `新增 ${changes} 条数据。`
      } else {
        changesMessage = `移除 ${Math.abs(changes)} 条错误数据。`
      }

      alert(null, `记录更新成功！${changesMessage}`)
    } catch (e) {
      // TODO: optimize error handling
      const isTimeoutdGachaUrlError = e && (e instanceof Error || typeof e === 'object')
        ? 'identifier' in e && e.identifier === 'TIMEOUTD_GACHA_URL'
        : false

      if (isTimeoutdGachaUrlError) {
        await updateAccountGachaUrl(facet, uid, null)
      }
      alert(e)
    } finally {
      produceState((draft) => {
        draft.busy = false
      })
    }
  }, [
    selectedAccount, gachaRecords, alert, pull,
    updateAccountGachaUrl, updateAccountProperties,
    refetchGachaRecords, produceState
  ])

  return (
    <Box display="inline-flex">
      <ButtonGroup ref={menuRef} disabled={busy}>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<CachedIcon />}
          onClick={handleFetch}
        >
          {`更新${action}`}
        </Button>
        <Button
          size="small"
          aria-controls={menu ? 'split-button-menu' : undefined}
          aria-expanded={menu ? 'true' : undefined}
          aria-haspopup="menu"
          onClick={handleToggleMenu}
        >
          <ArrowDropDownIcon fontSize="small" />
        </Button>
      </ButtonGroup>
      <Menu
        MenuListProps={{ dense: true }}
        anchorEl={menuRef.current}
        open={menu}
        onClose={handleMenuClose}
        elevation={1}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleFetch} data-full-amount="true">
          <ListItemIcon>
            <AutoModeIcon color="warning" />
          </ListItemIcon>
          <Typography variant="inherit" color="warning.main">全量更新</Typography>
        </MenuItem>
      </Menu>
      {busy && <Backdrop open={busy} sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'rgba(0, 0, 0, 0.75)',
        color: 'white'
      }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <CircularProgress color="info" />
          <Typography variant="h6" color="white" sx={{ marginTop: 2 }}>
            {`正在获取${action}记录中，请稍候...`}
          </Typography>
          <Typography variant="body1" sx={{ marginTop: 1 }}>
            {stringifyFragment(gachaRecords, currentFragment)}
          </Typography>
        </Box>
      </Backdrop>}
    </Box>
  )
}

function stringifyFragment (
  gachaRecords: GachaRecords,
  fragment: ReturnType<typeof useGachaRecordsFetcher>['currentFragment']
): string {
  if (fragment === 'idle') {
    return '空闲中...'
  } else if (fragment === 'sleeping') {
    return '等待中...'
  } else if (fragment === 'finished') {
    return '完成！'
  } else if ('ready' in fragment) {
    const gachaType = fragment.ready
    const category = gachaRecords.gachaTypeToCategoryMappings[gachaType]
    const categoryTitle = gachaRecords.namedValues[category]?.categoryTitle || category
    return `开始获取数据：${categoryTitle}`
  } else if ('pagination' in fragment) {
    const pagination = fragment.pagination
    return `获取第 ${pagination} 页数据...`
  } else if ('data' in fragment) {
    const data = fragment.data
    return `获取到 ${data.length} 条新数据...`
  } else {
    // Should never reach here
    return `Unknown fragment: ${JSON.stringify(fragment)}`
  }
}

function shouldPullNewbie (
  facet: AccountFacet,
  newbie: NamedGachaRecords
): Record<string, string | null> | null {
  // HACK:
  //   Genshin Impact    : Newbie Gacha Pool = 20 times
  //   Honkai: Star Rail :                   = 50 times
  //   Zenless Zone Zero : Useless
  if (facet === AccountFacet.Genshin && newbie.total >= 20) {
    return null
  } else if (facet === AccountFacet.StarRail && newbie.total >= 50) {
    return null
  } else if (facet === AccountFacet.ZenlessZoneZero) {
    return null
  } else {
    return {
      [newbie.gachaType]: newbie.lastEndId ?? null
    }
  }
}
