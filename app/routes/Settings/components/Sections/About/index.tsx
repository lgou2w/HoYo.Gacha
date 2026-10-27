import { KnownI18nNs } from '@/i18n'
import Section from '@/routes/Settings/components/Sections/Section'
import CreateLnk from './CreateLnk'
import Specification from './Specification'

export default function About () {
  return (
    <Section title={{ tKey: 'About.Title', tNs: KnownI18nNs.SettingsPage }}>
      <Specification />
      <CreateLnk />
    </Section>
  )
}
