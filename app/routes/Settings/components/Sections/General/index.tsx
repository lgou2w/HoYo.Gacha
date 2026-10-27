import { KnownI18nNs } from '@/i18n'
import Section from '@/routes/Settings/components/Sections/Section'
import BusinessVisibility from './BusinessVisibility'
import GachaClientarea from './GachaClientarea'
import Language from './Language'

export default function General () {
  return (
    <Section title={{ tKey: 'General.Title', tNs: KnownI18nNs.SettingsPage }}>
      <Language />
      <GachaClientarea />
      <BusinessVisibility />
    </Section>
  )
}
