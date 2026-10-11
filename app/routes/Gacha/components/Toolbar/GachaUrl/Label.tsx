import { ReactNode } from 'react'
import { Caption2, Tooltip, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import { useGachaUrl } from './hooks'

const useStyles = makeStyles({
  deadline: {
    marginLeft: tokens.spacingHorizontalS,
    color: tokens.colorBrandForeground2,
    borderBottom: `${tokens.strokeWidthThin} dashed ${tokens.colorBrandStroke2}`,
    cursor: 'help',
  },
  expired: {
    color: tokens.colorPaletteRedForeground1,
    borderBottomColor: tokens.colorPaletteRedForeground1,
    cursor: 'not-allowed',
  },
})

export default function GachaUrlLabel () {
  const styles = useStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const business = useBusiness()
  const url = useGachaUrl()

  let deadline: ReactNode
  if (url.deadline && url.hasExpired) {
    deadline = (
      <Caption2 className={mergeClasses(styles.deadline, styles.expired)}>
        {t('Toolbar.GachaUrl.HasExpired')}
      </Caption2>
    )
  } else if (url.deadline) {
    deadline = (
      <Tooltip
        content={url.deadline.format('LLLL')}
        relationship="label"
        positioning="after-top"
        withArrow
      >
        <Caption2 className={styles.deadline}>
          {t('Toolbar.GachaUrl.Deadline', { value: url.deadline.fromNow() })}
        </Caption2>
      </Tooltip>
    )
  }

  return (
    <>
      {t('Toolbar.GachaUrl.Label', { keyof: business.keyof })}
      {deadline}
    </>
  )
}
