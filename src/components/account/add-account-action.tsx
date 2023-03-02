import React, { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import AddIcon from '@mui/icons-material/Add'
import PermIdentityIcon from '@mui/icons-material/PermIdentity'
import LabelIcon from '@mui/icons-material/LabelOutlined'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import PanToolAltIcon from '@mui/icons-material/PanToolAlt'
import ConfirmDialog from '@/components/common/confirm-dialog'
import { FormContainer, TextFieldElement, SubmitHandler, UseFormReturn, useForm } from 'react-hook-form-mui'
import { useStatefulSettings } from '@/hooks/useStatefulSettings'
import Commands from '@/utilities/commands'
import { dialog } from '@tauri-apps/api'

interface FormProps {
  uid: string
  displayName: string
  gameDataDir: string
}

const FORM_ID = 'form-add-account'

export default function AddAccountAction () {
  const [open, setOpen] = useState(false)
  const handleClick = () => { setOpen(true) }
  const handleCancel = () => { setOpen(false) }
  return (
    <>
      <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleClick}>添加账号</Button>
      <ConfirmDialog open={open} title="添加账号"
        onCancel={handleCancel}
        ContentProps={{ dividers: true }}
        CancelButtonProps={{ color: 'error' }}
        ConfirmButtonProps={{ type: 'submit', form: FORM_ID }}
        maxWidth="xs"
        fullWidth
        persistent
      >
        <AddAccountForm id={FORM_ID} close={handleCancel} />
      </ConfirmDialog>
    </>
  )
}

interface AddAccountFormProps {
  id: string
  close?: () => void
}

function AddAccountForm (props: AddAccountFormProps) {
  const { addAccount } = useStatefulSettings()
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
    addAccount({
      uid: Number(data.uid),
      displayName: data.displayName,
      gameDataDir: data.gameDataDir
    })
      .then(() => { props.close?.() })
      .catch((error) => {
        context.setError('uid', { message: error })
      })
  }, [props])

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
        fullWidth
        required
      />
      <TextFieldElement name="displayName" type="text"
        label="昵称" placeholder="用于显示的自定义昵称"
        variant="filled" size="small" margin="dense"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LabelIcon />
            </InputAdornment>
          )
        }}
        fullWidth
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
        >
          自动查找
        </Button>
        <Button variant="outlined" size="small" color="success"
          startIcon={<PanToolAltIcon />}
          onClick={handleGameDataDirManualOpen}
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
