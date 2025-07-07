import React from 'react'
import { Caption1, Tooltip, makeStyles, tokens } from '@fluentui/react-components'
import { CalendarSyncRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import useAutoUpdate from '@/hooks/useAutoUpdate'
import useI18n from '@/hooks/useI18n'
import { CompositeState } from '@/pages/Gacha/LegacyView/Clientarea/useCompositeState'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalXS,
    alignItems: 'center',
    height: '1rem',
    '> *': {
      flexShrink: 0,
    },
  },
  time: {
    color: tokens.colorBrandForeground2,
    borderBottom: `${tokens.strokeWidthThin} dashed ${tokens.colorBrandStroke2}`,
    cursor: 'help',
  },
})

export default function GachaLegacyViewClientareaLastUpdated (props: CompositeState) {
  const styles = useStyles()
  const { keyofBusinesses, selectedAccount } = props
  const lastUpdated = selectedAccount.properties?.lastGachaRecordsUpdated
  const i18n = useI18n()

  useAutoUpdate(60 * 1000)

  if (!lastUpdated) {
    return null
  }

  const time = i18n.dayjs(lastUpdated)

  return (
    <div className={styles.root}>
      <CalendarSyncRegular />
      <Locale
        component={Caption1}
        as="span"
        mapping={[
          'Pages.Gacha.LegacyView.Clientarea.Overview.LastUpdated.Title',
          { keyofBusinesses },
        ]}
      >
        <Tooltip
          content={time.format('LLLL')}
          relationship="label"
          positioning="after"
          withArrow
        >
          <Caption1 className={styles.time} as="span">
            {time.fromNow()}
          </Caption1>
        </Tooltip>
      </Locale>
    </div>
  )
}
