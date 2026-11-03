import { ComponentType } from 'react'
import { Button, Popover, PopoverSurface, PopoverTrigger, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { EditSettingsRegular } from '@fluentui/react-icons'
import { KnownI18nNs, useI18n } from '@/i18n'
import BannerVisibilityMenu from '@/routes/Gacha/components/Banner/VisibilityMenu'
import { useClientarea } from '@/routes/Gacha/contexts/Clientarea/hooks'
import { Clientarea } from '@/routes/Gacha/contexts/Clientarea/types'
import AnalysisPersonalization from './Analysis/Personalization'

const useStyles = makeStyles({
  root: {
    flexShrink: 0,
  },
  trigger: {
    '[aria-expanded=true]': {
      color: tokens.colorBrandForeground2Hover,
      boxShadow: tokens.shadow2,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    rowGap: tokens.spacingVerticalM,
  },
})

const PersonalizationComponents: Record<Clientarea, ComponentType | null> = {
  [Clientarea.Overview]: null,
  [Clientarea.Analysis]: AnalysisPersonalization,
  [Clientarea.Chart]: null,
}

export default function Personalization () {
  const styles = useStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const { active: clientarea } = useClientarea()
  const PersonalizationComponent = PersonalizationComponents[clientarea]

  return (
    <div className={styles.root}>
      <Popover
        positioning={{ align: 'end', position: 'below', offset: { crossAxis: 0, mainAxis: 8 } }}
        closeOnScroll
      >
        <PopoverTrigger disableButtonEnhancement>
          <Button className={styles.trigger} icon={<EditSettingsRegular />} appearance="outline" size="small">
            {t('Clientarea.Personalization.Button')}
          </Button>
        </PopoverTrigger>
        <PopoverSurface tabIndex={-1}>
          <div className={styles.content}>
            <BannerVisibilityMenu />
            {PersonalizationComponent && (
              <PersonalizationComponent />
            )}
          </div>
        </PopoverSurface>
      </Popover>
    </div>
  )
}
