import { SettingsColor } from '@fluentui/react-icons'
import Nav from './Nav'

export default function SettingsNav () {
  return (
    <Nav
      pathname="/Settings"
      icon={<SettingsColor />}
    />
  )
}
