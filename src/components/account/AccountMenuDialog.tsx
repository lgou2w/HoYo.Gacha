import React from 'react'
import { dialog } from '@tauri-apps/api'
import { useForm, SubmitHandler } from 'react-hook-form'
import { Account, AccountFacet } from '@/interfaces/account'
import {
  useCreateAccountFn,
  useUpdateAccountGameDataDirFn,
  useUpdateAccountPropertiesFn,
  useDeleteAccountFn
} from '@/hooks/useStatefulAccount'
import PluginGacha from '@/utilities/plugin-gacha'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import PermIdentityIcon from '@mui/icons-material/PermIdentity'
import LabelIcon from '@mui/icons-material/Label'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import PanToolAltIcon from '@mui/icons-material/PanToolAlt'
import DeleteIcon from '@mui/icons-material/Delete'

export interface AccountMenuDialogProps {
  mode: 'add' | 'edit'
  open: boolean
  facet: AccountFacet
  accounts: Record<Account['uid'], Account>
  editAccountUid?: Account['uid']
  onClose?: () => void
}

export default function AccountMenuDialog (props: AccountMenuDialogProps) {
  const { mode, open, facet, accounts, editAccountUid, onClose } = props
  const [busy, setBusy] = React.useState(false)
  const deleteAccount = useDeleteAccountFn()
  const handleDeleteAccount = React.useCallback(async () => {
    if (editAccountUid) {
      setBusy(true)
      try {
        await deleteAccount(editAccountUid)
        onClose?.()
      } catch (e) {
        // TODO: handle error
        console.error(e)
      } finally {
        setBusy(false)
      }
    }
  }, [editAccountUid, setBusy, deleteAccount, onClose])

  const id = 'account-menu-dialog-form'
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle display="flex" alignItems="center">
        {mode === 'add' ? '添加账号' : '编辑账号'}
        {mode === 'edit' && (
          <Tooltip
            placement="left"
            title={(
              <React.Fragment>
                <Typography variant="body1">删除该账号</Typography>
                <Typography variant="caption">注：不会清空该账号已存储的数据。</Typography>
              </React.Fragment>
            )}
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
        <Button onClick={onClose} color="error" disabled={busy}>取消</Button>
        <Button type="submit" form={id} disabled={busy}>确认</Button>
      </DialogActions>
    </Dialog>
  )
}

interface IFormInput {
  uid: string
  displayName?: string // -> Account['properties']['displayName']
  gameDataDir: string
}

interface AccountMenuDialogFormProps {
  id: string
  mode: AccountMenuDialogProps['mode']
  facet: AccountMenuDialogProps['facet']
  accounts: AccountMenuDialogProps['accounts']
  editAccountUid?: AccountMenuDialogProps['editAccountUid']
  busy: boolean
  setBusy: React.Dispatch<React.SetStateAction<boolean>>
  onSuccess?: () => void
}

function AccountMenuDialogForm (props: AccountMenuDialogFormProps) {
  const { mode, id, facet, accounts, editAccountUid, busy, setBusy, onSuccess } = props

  const editAccount = editAccountUid ? accounts[editAccountUid] : null
  const { register, setValue, setError, formState: { errors }, handleSubmit } = useForm<IFormInput>({
    values: editAccount
      ? {
          uid: editAccount.uid,
          gameDataDir: editAccount.gameDataDir,
          displayName: editAccount.properties?.displayName ?? undefined
        }
      : undefined
  })

  const isEdit = mode === 'edit'
  const createAccount = useCreateAccountFn()
  const updateAccountProperties = useUpdateAccountPropertiesFn()
  const updateAccountGameDataDir = useUpdateAccountGameDataDirFn()

  const handleGameDataDirAutoFind = React.useCallback(() => {
    PluginGacha.findGameDataDirectories(facet).then((value) => {
      if (value.length >= 1) {
        // TODO: Multi select for Game data dir
        setValue('gameDataDir', value[0])
      } else {
        setError('gameDataDir', { message: '未找到有效的游戏数据文件夹！' })
      }
    }).catch((error) => {
      setError('gameDataDir', {
        message: error instanceof Error || typeof error === 'object'
          ? error.message
          : error
      })
    })
  }, [facet, setValue, setError])

  const handleGameDataDirManualOpen = React.useCallback(() => {
    dialog.open({
      title: '请选择游戏数据文件夹：',
      directory: true,
      multiple: false
    }).then((result) => {
      if (typeof result === 'string') {
        result = result.replace(/\\/g, '/')
        setValue('gameDataDir', result)
      }
    }).catch((error) => {
      setError('gameDataDir', {
        message: error instanceof Error || typeof error === 'object'
          ? error.message
          : error
      })
    })
  }, [setValue, setError])

  const handleCreateAccount = React.useCallback(async (uid: number, data: IFormInput) => {
    if (accounts[uid]) {
      setError('uid', { message: '该账号 UID 已存在！' })
      return Promise.resolve()
    }

    // TODO: Account properties customization
    const properties: Account['properties'] = data.displayName
      ? { displayName: data.displayName }
      : null

    await createAccount({
      uid: String(uid),
      gameDataDir: data.gameDataDir,
      gachaUrl: null,
      properties
    })
  }, [accounts, setError, createAccount])

  const handleUpdateAccount = React.useCallback(async (uid: number, data: IFormInput) => {
    // TODO: Optimize to once update
    const editAccount = accounts[uid]
    await updateAccountGameDataDir(facet, editAccount.uid, data.gameDataDir)
    await updateAccountProperties(facet, editAccount.uid, {
      ...editAccount.properties,
      displayName: data.displayName ?? null
    })
  }, [accounts, updateAccountProperties, updateAccountGameDataDir])

  const onSubmit = React.useCallback<SubmitHandler<IFormInput>>(async (data) => {
    const uid = Number(data.uid)

    const isZZZ = facet === AccountFacet.ZenlessZoneZero
    if ((isZZZ && uid < 10_000_000) || (!isZZZ && uid < 100_000_000)) {
      setError('uid', { message: '请输入正确的 UID 值！' })
      return
    }

    setBusy(true)
    try {
      !isEdit
        ? await handleCreateAccount(uid, data)
        : await handleUpdateAccount(uid, data)
      onSuccess?.()
    } catch (e) {
      setError('uid', {
        message: e instanceof Error || typeof e === 'object'
          ? (e as Error).message
          : String(e)
      })
    } finally {
      setBusy(false)
    }
  }, [facet, setBusy, onSuccess, setError, isEdit, handleCreateAccount, handleUpdateAccount])

  return (
    <form id={id} onSubmit={handleSubmit(onSubmit)} autoComplete="off" noValidate>
      <TextField
        label="UID" placeholder="账号 UID"
        variant="filled" size="small" margin="dense"
        fullWidth required
        disabled={isEdit || busy}
        error={!!errors.uid}
        helperText={errors.uid?.message}
        InputProps={{
          ...register('uid', {
            required: '请填写账号 UID 字段！',
            validate: value => {
              const isZZZ = facet === AccountFacet.ZenlessZoneZero
              return (isZZZ
                ? +value >= 10_000_000
                : /^[1-9][0-9]{8}$/.test(value)
              ) || '请输入正确的 UID 值！'
            }
          }),
          onKeyPress: numericOnly,
          startAdornment: (
            <InputAdornment position="start">
              <PermIdentityIcon />
            </InputAdornment>
          )
        }}
      />
      <TextField
        label="昵称" placeholder="自定义昵称（可选）"
        variant="filled" size="small" margin="dense"
        fullWidth
        disabled={busy}
        error={!!errors.displayName}
        helperText={errors.displayName?.message}
        InputProps={{
          ...register('displayName', {
            validate: value => value ? value.length <= 16 || '昵称不能超过 16 个字符！' : true
          }),
          startAdornment: (
            <InputAdornment position="start">
              <LabelIcon />
            </InputAdornment>
          )
        }}
      />
      <TextField
        name="gameDataDir" label="游戏数据文件夹" type="text"
        placeholder={'例如：' + FacetGameDataDirExamples[facet]}
        variant="filled" size="small" margin="dense"
        fullWidth required
        disabled={busy}
        error={!!errors.gameDataDir}
        helperText={errors.gameDataDir?.message}
        InputProps={{
          ...register('gameDataDir', {
            required: '请选择游戏数据目录！'
          }),
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start" sx={{ height: '100%' }}>
              <FolderOpenIcon />
            </InputAdornment>
          )
        }}
      />
      <Stack direction="row" spacing={1} marginTop={1}>
        <Button variant="outlined" size="small" color="secondary"
          startIcon={<GpsFixedIcon />}
          onClick={handleGameDataDirAutoFind}
          disabled={busy}
        >
          自动查找
        </Button>
        <Button variant="outlined" size="small" color="success"
          startIcon={<PanToolAltIcon />}
          onClick={handleGameDataDirManualOpen}
          disabled={busy}
        >
          手动选择
        </Button>
      </Stack>
    </form>
  )
}

const FacetGameDataDirExamples: Record<AccountFacet, string> = {
  [AccountFacet.Genshin]: 'D:/Genshin Impact/Genshin Impact Game/YuanShen_Data',
  [AccountFacet.StarRail]: 'D:/StarRail/Game/StarRail_Data',
  [AccountFacet.ZenlessZoneZero]: 'D:/ZenlessZoneZero Game/ZenlessZoneZero_Data'
}

function numericOnly (evt: React.KeyboardEvent<HTMLElement>) {
  const keyCode = evt.which ? evt.which : evt.keyCode
  if (keyCode > 31 && (keyCode < 48 || keyCode > 57) && keyCode !== 46) {
    evt.preventDefault()
  }
}
