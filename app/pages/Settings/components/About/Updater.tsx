import { Button } from '@fluentui/react-components'
import { ArrowClockwiseRegular } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'
import SectionItem from '@/pages/Settings/components/SectionItem'

export default withTrans.SettingsPage(function Updater ({ t }: WithTrans) {
  return (
    <SectionItem
      icon={<ArrowClockwiseRegular />}
      title={t('About.Updater.Title')}
      subtitle={t('About.Updater.Subtitle')}
    >
      <Button appearance="primary">
        {t('About.Updater.CheckBtn')}
      </Button>
    </SectionItem>
  )
})
