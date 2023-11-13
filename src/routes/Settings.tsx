import React, { Fragment } from 'react'
import SettingsSectionGroupAppearance from '@/components/Routes/Settings/Section/Appearance'
import SettingsSectionGroupGeneral from '@/components/Routes/Settings/Section/General'

export default function Settings () {
  return (
    <Fragment>
      <SettingsSectionGroupGeneral />
      <SettingsSectionGroupAppearance />
    </Fragment>
  )
}
