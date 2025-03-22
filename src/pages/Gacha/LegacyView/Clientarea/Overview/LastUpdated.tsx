import React from 'react'
import { Caption1, makeStyles, tokens } from '@fluentui/react-components'
import { CalendarSyncRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import Tooltip from '@/components/UI/Tooltip'
import useI18n from '@/hooks/useI18n'
import { ParentCompositeState } from './declares'

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalXS,
    alignItems: 'center',
  },
  time: {
    color: tokens.colorBrandForeground2,
    borderBottom: `${tokens.strokeWidthThin} dashed ${tokens.colorBrandStroke2}`,
    cursor: 'help',
  },
})

export default function GachaLegacyViewClientareaOverviewLastUpdated (props: ParentCompositeState) {
  const styles = useStyles()
  const { keyofBusinesses, selectedAccount } = props
  const lastUpdated = selectedAccount.properties?.lastGachaRecordsUpdated
  const i18n = useI18n()

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
