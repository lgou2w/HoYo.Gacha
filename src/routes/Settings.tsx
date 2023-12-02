import React, { Fragment } from 'react'
import { Subtitle1 } from '@fluentui/react-components'
import Locale from '@/components/Core/Locale'
import SettingsGroupAbout from '@/components/Settings/About'
import SettingsGroupAppearance from '@/components/Settings/Appearance'
import SettingsGroupGeneral from '@/components/Settings/General'

export default function Settings () {
  return (
    <Fragment>
      <Locale component={Subtitle1} as="h5" mapping={['components.settings.title']} />
      <SettingsGroupGeneral />
      <SettingsGroupAppearance />
      <SettingsGroupAbout />
    </Fragment>
  )
}
