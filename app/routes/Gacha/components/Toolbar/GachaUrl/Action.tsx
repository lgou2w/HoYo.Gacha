import { memo } from 'react'
import { Body1, Dialog, DialogSurface, Menu, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuList, MenuPopover, MenuTrigger, Spinner, SplitButton, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowClockwiseRegular, ArrowSyncRegular, LinkEditRegular } from '@fluentui/react-icons'
import { KeyofAccountBusiness } from '@/api/Account'
import { KnownI18nNs, UseI18n, useI18n } from '@/i18n'
import { FetchRecordsEvent, FetchRecordsEventKind, SaveToDatabase } from '@/routes/Gacha/api/business'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import { useAction } from './hooks'
import { DataAction } from './types'

export default function GachaUrlAction () {
  const business = useBusiness()
  const { isFetching, fetchEvent, disabled, update } = useAction()

  return (
    <>
      <ActionMenu disabled={disabled} update={update} />
      <ActionFetchDialog
        keyof={business.keyof}
        isFetching={isFetching}
        fetchEvent={fetchEvent}
      />
    </>
  )
}

type ActionMenuProps = Pick<ReturnType<typeof useAction>, 'disabled' | 'update'>

const ActionMenu = memo(function ActionMenu (props: ActionMenuProps) {
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Toolbar.GachaUrl.Action' })
  const { disabled, update } = props

  return (
    <Menu
      positioning={{ align: 'end', offset: { crossAxis: 0, mainAxis: 8 } }}
    >
      <MenuTrigger disableButtonEnhancement>
        {(triggerProps) => (
          <SplitButton
            icon={<ArrowClockwiseRegular />}
            menuButton={triggerProps}
            primaryActionButton={{
              onClick: update,
              ...{ [DataAction]: SaveToDatabase.Yes },
            }}
            disabled={disabled}
            appearance="primary"
            size="large"
          >
            {t('Button')}
          </SplitButton>
        )}
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuGroupHeader>
            {t('More.Label')}
          </MenuGroupHeader>
          <MenuGroup>
            <MenuItem
              icon={<ArrowSyncRegular />}
              onClick={update}
              {...{ [DataAction]: SaveToDatabase.FullUpdate }}
            >
              {t('More.FullUpdate')}
            </MenuItem>
          </MenuGroup>
          <MenuDivider />
          <MenuGroup>
            <MenuItem
              icon={<LinkEditRegular />}
            >
              {t('More.ManualInput')}
            </MenuItem>
          </MenuGroup>
        </MenuList>
      </MenuPopover>
    </Menu>
  )
})

const useFetchDialogStyles = makeStyles({
  surface: {
    maxWidth: '20rem',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: tokens.spacingVerticalM,
  },
})

type ActionFetchDialogProps = Pick<ReturnType<typeof useAction>, 'isFetching' | 'fetchEvent'> & {
  keyof: KeyofAccountBusiness
}

const ActionFetchDialog = memo(function ActionFetchDialog (props: ActionFetchDialogProps) {
  const { keyof, isFetching, fetchEvent } = props
  const styles = useFetchDialogStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Toolbar.GachaUrl.Action' })

  return (
    <Dialog open={isFetching} modalType="alert" surfaceMotion={null}>
      <DialogSurface className={styles.surface}>
        <div className={styles.wrapper}>
          <Spinner />
          <Body1>
            {stringifyFetchEvent(keyof, fetchEvent, t)}
          </Body1>
        </div>
      </DialogSurface>
    </Dialog>
  )
})

function stringifyFetchEvent (
  keyof: KeyofAccountBusiness,
  event: FetchRecordsEvent | null,
  t: UseI18n['t'],
): string {
  let subkey: string
  let options: Record<string, unknown> | undefined

  if (!event) {
    subkey = 'Idle'
  } else if (typeof event === 'string') {
    subkey = event
  } else if (FetchRecordsEventKind.Ready in event) {
    subkey = FetchRecordsEventKind.Ready
    options = { keyof, category: event[FetchRecordsEventKind.Ready] }
  } else if (FetchRecordsEventKind.Pagination in event) {
    subkey = FetchRecordsEventKind.Pagination
    options = { count: event[FetchRecordsEventKind.Pagination] }
  } else if (FetchRecordsEventKind.Data in event) {
    subkey = FetchRecordsEventKind.Data
    options = { count: event[FetchRecordsEventKind.Data] }
  } else if (FetchRecordsEventKind.Completed in event) {
    subkey = FetchRecordsEventKind.Completed
    options = { keyof, category: event[FetchRecordsEventKind.Completed] }
  } else {
    // HACK: should never reach here
    throw new Error('unreachable')
  }

  return t(`Fetch.Event.${subkey}`, options)
}
