import React, { Fragment } from 'react'
import { Subtitle1 } from '@fluentui/react-components'
import Locale from '@/components/Commons/Locale'
import SettingsGroupAbout from '@/pages/Settings/About'
import SettingsGroupAppearance from '@/pages/Settings/Appearance'
import SettingsGroupGeneral from '@/pages/Settings/General'

export default function Settings () {
  return (
    <Fragment>
      <Locale component={Subtitle1} as="h5" mapping={['Pages.Settings.Title']} />
      <SettingsGroupGeneral />
      <SettingsGroupAppearance />
      <SettingsGroupAbout />
    </Fragment>
  )
}
