import { Tooltip, TooltipProps } from '@fluentui/react-components'
import { FluentIcon } from '@fluentui/react-icons'
import { KnownI18nNs, useI18n } from '@/i18n'

export interface BannerDragIconProps {
  className?: string
  icon: FluentIcon
  dragRef: (el: Element | null) => void
  tooltipPositioning?: TooltipProps['positioning']
}

export default function BannerDragIcon (props: BannerDragIconProps) {
  const { className, icon: Icon, dragRef, tooltipPositioning } = props
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })

  return (
    <Tooltip
      content={t('Clientarea.BannerDragIcon.Tooltip')}
      positioning={tooltipPositioning}
      relationship="label"
      withArrow
    >
      <Icon
        className={className}
        ref={dragRef}
      />
    </Tooltip>
  )
}
