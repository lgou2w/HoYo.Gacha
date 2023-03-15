import React, { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import AddIcon from '@mui/icons-material/Add'
import PermIdentityIcon from '@mui/icons-material/PermIdentity'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import PanToolAltIcon from '@mui/icons-material/PanToolAlt'
import ConfirmDialog from '@/components/common/confirm-dialog'
import { FormContainer, TextFieldElement, SubmitHandler, UseFormReturn, useForm } from 'react-hook-form-mui'
import { Account } from '@/interfaces/settings'
import useStatefulSettings from '@/hooks/useStatefulSettings'
import Commands from '@/utilities/commands'
import { dialog } from '@tauri-apps/api'

interface FormProps {
  uid: string
  gameDataDir: string
}

const FORM_ID = 'form-add-account'

export default function AccountActionAdd () {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const handleClick = () => { setOpen(true) }
  const handleCancel = () => { setOpen(false) }
  return (
    <>
      <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleClick}>添加账号</Button>
      <ConfirmDialog open={open} title="添加账号"
        onCancel={handleCancel}
        ContentProps={{ dividers: true }}
        CancelButtonProps={{ color: 'error', disabled: busy }}
        ConfirmButtonProps={{ type: 'submit', form: FORM_ID, disabled: busy }}
        maxWidth="xs"
        fullWidth
        persistent
      >
        <AccountAddForm id={FORM_ID} close={handleCancel} busy={busy} setBusy={setBusy} />
      </ConfirmDialog>
    </>
  )
}

interface AccountAddFormProps {
  id: string
  busy: boolean
  setBusy: (busy: boolean) => void
  close?: () => void
}

function AccountAddForm (props: AccountAddFormProps) {
  const { accounts, enkaNetwork, addAccount } = useStatefulSettings()
  const context = useForm<FormProps>()

  const handleGameDataDirAutoFind = useCallback(() => {
    handleGameDataDir(
      context,
      Commands
        .findAvailableGameDirectories()
        .then((value) => {
          if (value.length >= 1) {
            // TODO: Multi select for Game data dir
            return value[0].gameDataDir
          } else {
            throw new Error('未找到有效的游戏目录！')
          }
        })
    )
  }, [context])

  const handleGameDataDirManualOpen = useCallback(() => {
    handleGameDataDir(
      context,
      dialog
        .open({
          title: '请选择游戏数据目录：',
          directory: true,
          multiple: false
        })
        .then((value) => {
          if (typeof value === 'string') {
            return value.replace(/\\/g, '/')
          } return ''
        })
    )
  }, [context])

  const handleSubmit = useCallback<SubmitHandler<FormProps>>((data) => {
    const uid = Number(data.uid)
    if (uid < 1_0000_0000) {
      context.setError('uid', { message: '请输入正确的 UID 值！' })
      return
    }
    if (accounts[uid]) {
      context.setError('uid', { message: '该账号已存在！' })
      return
    }

    props.setBusy(true)
    const accountPromise = enkaNetwork
      ? Commands
        .thirdPartyEnkaNetworkFetchPlayerInfo({ uid })
        .then((playerInfo) => ({
          uid,
          level: playerInfo.level,
          avatarId: playerInfo.profilePicture.avatarId,
          displayName: playerInfo.nickname,
          signature: playerInfo.signature,
          nameCardId: playerInfo.nameCardId,
          gameDataDir: data.gameDataDir
        } as Account))
      : Promise.resolve({ uid, gameDataDir: data.gameDataDir } as Account)

    accountPromise
      .then((account) => addAccount(account))
      .then(() => props.close?.())
      .catch((error) => {
        context.setError('uid', {
          message: error instanceof Error || typeof error === 'object'
            ? (error as Error).message
            : error as string
        })
      })
      .finally(() => props.setBusy(false))
  }, [accounts, enkaNetwork, addAccount, props])

  return (
    <FormContainer formContext={context} onSuccess={handleSubmit} FormProps={{
      id: props.id,
      autoComplete: 'off',
      noValidate: true
    }}>
      <TextFieldElement name="uid" type="text"
        label="UID" placeholder="账号 UID"
        variant="filled" size="small" margin="dense"
        validation={{
          required: '请填写账号 UID 字段！',
          validate: value => /\d+/.test(value) || '请输入正确的 UID 值！'
        }}
        InputProps={{
          onKeyPress: numericOnly,
          startAdornment: (
            <InputAdornment position="start">
              <PermIdentityIcon />
            </InputAdornment>
          )
        }}
        disabled={props.busy}
        fullWidth
        required
      />
      <TextFieldElement name="gameDataDir" label="目录" type="text"
        placeholder={'游戏数据目录的完整路径\n例如：D:/Genshin Impact/Genshin Impact Game/YuanShen_Data'}
        variant="filled" size="small" margin="dense"
        validation={{ required: '请选择游戏数据目录！' }}
        InputProps={{
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start" sx={{ height: '100%' }}>
              <FolderOpenIcon />
            </InputAdornment>
          )
        }}
        disabled={props.busy}
        minRows={2}
        multiline
        fullWidth
        required
      />
      <Box marginTop={1}>
        <Button variant="outlined" size="small" color="secondary"
          startIcon={<GpsFixedIcon />}
          sx={{ marginRight: 1 }}
          onClick={handleGameDataDirAutoFind}
          disabled={props.busy}
        >
          自动查找
        </Button>
        <Button variant="outlined" size="small" color="success"
          startIcon={<PanToolAltIcon />}
          onClick={handleGameDataDirManualOpen}
          disabled={props.busy}
        >
          手动选择
        </Button>
      </Box>
    </FormContainer>
  )
}

function numericOnly (evt: React.KeyboardEvent<HTMLElement>) {
  const keyCode = evt.which ? evt.which : evt.keyCode
  if (keyCode > 31 && (keyCode < 48 || keyCode > 57) && keyCode !== 46) {
    evt.preventDefault()
  }
}

function handleGameDataDir (context: UseFormReturn<FormProps>, promise: Promise<string>) {
  promise.then((value) => {
    context.setValue('gameDataDir', value, {
      shouldValidate: true
    })
  }).catch((error) => {
    context.setError('gameDataDir', {
      type: 'manual',
      message: error instanceof Error || typeof error === 'object'
        ? error.message
        : error
    })
  })
}
