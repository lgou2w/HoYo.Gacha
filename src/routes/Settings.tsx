import React, { Fragment } from 'react'
import SettingsGroupAppearance from '@/components/Routes/Settings/Appearance'
import SettingsGroupGeneral from '@/components/Routes/Settings/General'

export default function Settings () {
  return (
    <Fragment>
      <SettingsGroupGeneral />
      <SettingsGroupAppearance />
    </Fragment>
  )
}
