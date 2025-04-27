import React, { Fragment, useCallback, useState } from 'react'
import { Body1, Button, Caption1, Caption2, Dialog, DialogSurface, Field, Input, Menu, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuList, MenuPopover, MenuTrigger, Spinner, SplitButton, Tooltip, inputClassNames, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { ArrowClockwiseRegular, ArrowSyncRegular, CopyRegular, LinkEditRegular, LinkRegular } from '@fluentui/react-icons'
import * as clipboard from '@tauri-apps/plugin-clipboard-manager'
import { produce } from 'immer'
import { GachaRecordsFetcherFragmentKind, GachaUrlErrorKind, fromWebCachesGachaUrl, isGachaUrlError } from '@/api/commands/business'
import { extractErrorMessage } from '@/api/error'
import { useSelectedAccountSuspenseQueryData, useUpdateAccountPropertiesMutation } from '@/api/queries/accounts'
import { invalidatePrettizedGachaRecordsQuery, usePrettizedGachaRecordsSuspenseQueryData } from '@/api/queries/business'
import Locale, { LocaleMapping } from '@/components/Locale'
import useBusinessContext from '@/hooks/useBusinessContext'
import useGachaRecordsFetcher, { GachaRecordsFetcherFetchArgs, GachaRecordsFetcherFetchFragment } from '@/hooks/useGachaRecordsFetcher'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import { KnownAccountProperties, detectAccountUidRegion } from '@/interfaces/Account'
import { Business, KeyofBusinesses } from '@/interfaces/Business'
import { computeGachaTypeAndLastEndIdMappings } from '@/interfaces/GachaRecord'
import dayjs from '@/utilities/dayjs'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalL,
  },
})

export default function GachaLegacyViewToolbarUrl () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <GachaLegacyViewToolbarUrlLabel />
      <div className={styles.content}>
        <GachaLegacyViewToolbarUrlInput />
        <GachaLegacyViewToolbarUrlButton />
      </div>
    </div>
  )
}

function computeGachaUrlDeadline (creationTime: KnownAccountProperties['gachaUrlCreationTime']): dayjs.Dayjs | null {
  if (typeof creationTime === 'undefined' || creationTime === null) {
    return null
  } else {
    // HACK: The Gacha url is valid for 1 day.
    return dayjs(creationTime).add(1, 'day')
  }
}

const useLabelStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
  },
  deadline: {
    marginLeft: tokens.spacingHorizontalS,
    color: tokens.colorBrandForeground2,
    borderBottom: `${tokens.strokeWidthThin} dashed ${tokens.colorBrandStroke2}`,
    cursor: 'help',
  },
  deadlineExpired: {
    color: tokens.colorPaletteRedForeground1,
    borderBottomColor: tokens.colorPaletteRedForeground1,
    cursor: 'auto',
  },
})

function GachaLegacyViewToolbarUrlLabel () {
  const styles = useLabelStyles()
  const { keyofBusinesses } = useBusinessContext()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const i18n = useI18n()

  const deadline = computeGachaUrlDeadline(selectedAccount?.properties?.gachaUrlCreationTime)
    ?.locale(i18n.constants.dayjs)
  const hasExpired = !!deadline && deadline.isBefore()

  return (
    <div className={styles.root}>
      <LinkRegular />
      <Locale
        component={Caption1}
        mapping={['Pages.Gacha.LegacyView.Toolbar.Url.Title', { keyofBusinesses }]}
      >
        {deadline && (hasExpired
          ? <Locale
              className={mergeClasses(styles.deadline, styles.deadlineExpired)}
              component={Caption2}
              mapping={['Pages.Gacha.LegacyView.Toolbar.Url.Expired']}
            />
          : <Tooltip
            content={deadline.format('LLLL')}
            relationship="label"
            positioning="after"
            withArrow
          >
            <Caption2 className={styles.deadline}>
              <Locale
                mapping={[
                  'Pages.Gacha.LegacyView.Toolbar.Url.Deadline',
                  { deadline: deadline.fromNow() },
                ]}
              />
            </Caption2>
          </Tooltip>
        )}
      </Locale>
    </div>
  )
}

const useInputStyles = makeStyles({
  input: {
    maxWidth: '12rem',
  },
  inputExpired: {
    [`& .${inputClassNames.input}`]: {
      color: tokens.colorPaletteRedForeground1,
    },
  },
  inputValid: {
    [`& .${inputClassNames.input}`]: {
      color: tokens.colorBrandForeground2,
    },
  },
})

function GachaLegacyViewToolbarUrlInput () {
  const styles = useInputStyles()
  const { keyofBusinesses } = useBusinessContext()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const i18n = useI18n()

  const { gachaUrl, gachaUrlCreationTime } = selectedAccount?.properties || {}
  const deadline = computeGachaUrlDeadline(gachaUrlCreationTime)
    ?.locale(i18n.constants.dayjs)
  const hasExpired = !!deadline && deadline.isBefore()

  const [copyVisible, setCopyVisible] = useState(false)
  const copyUrl = useCallback(async () => {
    if (gachaUrl) {
      await clipboard.writeText(gachaUrl)
      console.debug('Copying URL to clipboard:', gachaUrl)
    }
  }, [gachaUrl])

  return (
    <Field validationState={hasExpired ? 'error' : undefined}>
      <Input
        className={mergeClasses(
          styles.input,
          hasExpired ? styles.inputExpired : styles.inputValid,
        )}
        contentAfter={(
          <Tooltip
            content={i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.CopyBtn')}
            relationship="label"
            positioning="before"
            visible={copyVisible && !!gachaUrl}
            onVisibleChange={(_, data) => setCopyVisible(data.visible)}
            withArrow
          >
            <Button
              icon={<CopyRegular />}
              appearance="subtle"
              shape="circular"
              size="small"
              onClick={copyUrl}
              disabled={!gachaUrl}
            />
          </Tooltip>
        )}
        size="large"
        appearance="outline"
        placeholder={i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Input.Placeholder', { keyofBusinesses })}
        value={gachaUrl ?? ''}
        readOnly
      />
    </Field>
  )
}

const useButtonStyles = makeStyles({
  root: {
    alignSelf: 'stretch',
    minHeight: '2.5rem',
  },
  fetchSurface: {
    maxWidth: '20rem',
  },
  fetchContainer: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
    alignItems: 'center',
  },
})

function GachaLegacyViewToolbarUrlButton () {
  const styles = useButtonStyles()
  const { business, keyofBusinesses } = useBusinessContext()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const prettized = usePrettizedGachaRecordsSuspenseQueryData(business, selectedAccount?.uid)

  const [isBusy, setBusy] = useState(false)
  const updateAccountPropertiesMutation = useUpdateAccountPropertiesMutation()
  const gachaRecordsFetcher = useGachaRecordsFetcher()
  const notifier = useNotifier()
  const i18n = useI18n()

  const disabled = !selectedAccount || !prettized || isBusy || gachaRecordsFetcher.state.isFetching
  const handleUpdate = useCallback(async (
    saveToDatabase: GachaRecordsFetcherFetchArgs<Business>['saveToDatabase'],
  ) => {
    if (!selectedAccount || !prettized) {
      return
    }

    notifier.dismissAll()
    setBusy(true)

    const { business, uid } = selectedAccount
    const region = detectAccountUidRegion(business, uid)! // FIXME: Maybe null
    const properties = { ...selectedAccount.properties } // Need to modify
    const gachaUrlDeadline = computeGachaUrlDeadline(properties.gachaUrlCreationTime)

    if (properties.gachaUrl && gachaUrlDeadline && !gachaUrlDeadline.isAfter()) {
      console.info('Gacha URL is expired, need to reobtain...')
      properties.gachaUrl = null
      properties.gachaUrlCreationTime = null
    }

    if (!properties.gachaUrl) {
      try {
        const data = await notifier.promise(fromWebCachesGachaUrl({
          business,
          region,
          dataFolder: selectedAccount.dataFolder,
          expectedUid: uid,
        }), {
          loading: {
            title: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Obtain.Loading', { keyofBusinesses }),
          },
          error: (error) => {
            const message = extractErrorMessage(error)
            return {
              title: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Obtain.Error.Title', { keyofBusinesses }),
              body: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Obtain.Error.Body', {
                message,
              }),
              timeout: -1,
              dismissible: true,
            }
          },
        })
        properties.gachaUrl = data.value
        properties.gachaUrlCreationTime = data.creationTime
      } catch (error) {
        if (isGachaUrlError(error) && error.details.kind === GachaUrlErrorKind.AuthkeyTimeout) {
          // Expired, remove fields
          properties.gachaUrl = null
          properties.gachaUrlCreationTime = null
        }

        setBusy(false)
        throw error
      } finally {
        await updateAccountPropertiesMutation.mutateAsync({
          business,
          uid,
          properties,
        })
      }
    }

    const eventChannel = 'HG_GACHA_RECORDS_FETCHER_CHANNEL_' + Math.random().toString().replace('.', '_')
    const gachaTypeAndLastEndIdMappings = computeGachaTypeAndLastEndIdMappings(prettized.business, prettized.categorizeds)

    let changes: number
    try {
      changes = await notifier.promise(gachaRecordsFetcher.fetch({
        business,
        region,
        uid,
        gachaUrl: properties.gachaUrl,
        gachaTypeAndLastEndIdMappings,
        eventChannel,
        saveToDatabase,
      }), {
        loading: {
          title: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Fetch.Loading', { keyofBusinesses }),
        },
        success: (changes) => {
          if (changes === null) {
            // It should be unreachable
            // changes must not be null
            return
          }

          // Positive numbers are added, negative numbers are deleted
          const body = changes >= 0 ? 'AddedBody' : 'DeletedBody'
          return {
            title: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Fetch.Success.Title', { keyofBusinesses }),
            body: i18n.t(`Pages.Gacha.LegacyView.Toolbar.Url.Fetch.Success.${body}`, {
              changes: Math.abs(changes),
            }),
            timeout: -1,
            dismissible: true,
          }
        },
        error: (error) => {
          const message = extractErrorMessage(error)
          return {
            title: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Fetch.Error.Title', { keyofBusinesses }),
            body: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Fetch.Error.Body', {
              message,
            }),
            timeout: -1,
            dismissible: true,
          }
        },
      }) ?? 0
    } catch (error) {
      setBusy(false)
      throw error
    }

    const lastGachaRecordsUpdated = dayjs().toISOString()
    await updateAccountPropertiesMutation.mutateAsync({
      business,
      uid,
      properties: produce(properties, (draft) => {
        draft.lastGachaRecordsUpdated = lastGachaRecordsUpdated
      }),
    })

    // if nothing has changed, no need to invalidate the cache
    if (changes !== 0) {
      console.debug('Invalidating prettized gacha records cache...')
      await invalidatePrettizedGachaRecordsQuery(business, uid)
    }

    setBusy(false)
  }, [gachaRecordsFetcher, i18n, keyofBusinesses, notifier, prettized, selectedAccount, updateAccountPropertiesMutation])

  return (
    <Fragment>
      <Menu positioning="below-end">
        <MenuTrigger disableButtonEnhancement>
          {(triggerProps) => (
            <Locale
              component={SplitButton}
              className={styles.root}
              appearance="primary"
              size="large"
              icon={<ArrowClockwiseRegular />}
              primaryActionButton={{ onClick: () => handleUpdate('Yes') }}
              menuButton={triggerProps}
              disabled={disabled}
              mapping={['Pages.Gacha.LegacyView.Toolbar.Url.UpdateBtn']}
            />
          )}
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <Locale
              component={MenuGroupHeader}
              mapping={['Pages.Gacha.LegacyView.Toolbar.Url.More']}
            />
            <MenuGroup>
              <Locale
                component={MenuItem}
                icon={<ArrowSyncRegular />}
                onClick={() => handleUpdate('FullUpdate')}
                mapping={['Pages.Gacha.LegacyView.Toolbar.Url.FullUpdateBtn']}
              />
            </MenuGroup>
            <MenuDivider />
            <MenuGroup>
              <Locale
                component={MenuItem}
                icon={<LinkEditRegular />}
                mapping={['Pages.Gacha.LegacyView.Toolbar.Url.ManualInputBtn']}
                // TODO: Manual input url
              />
            </MenuGroup>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Dialog
        modalType="alert"
        surfaceMotion={null}
        open={gachaRecordsFetcher.state.isFetching}
      >
        <DialogSurface className={styles.fetchSurface}>
          <div className={styles.fetchContainer}>
            <Spinner />
            <Locale
              component={Body1}
              mapping={stringifyFragment(keyofBusinesses, gachaRecordsFetcher.state.fragment)}
            />
          </div>
        </DialogSurface>
      </Dialog>
    </Fragment>
  )
}

function stringifyFragment (
  keyofBusinesses: KeyofBusinesses,
  fragment: GachaRecordsFetcherFetchFragment<Business>,
): LocaleMapping {
  let subkey: string
  let options: Record<string, unknown> | undefined

  if (typeof fragment === 'string') {
    subkey = fragment
  } else {
    if (GachaRecordsFetcherFragmentKind.Ready in fragment) {
      subkey = GachaRecordsFetcherFragmentKind.Ready
      options = { value: fragment.Ready, keyofBusinesses }
    } else if (GachaRecordsFetcherFragmentKind.Pagination in fragment) {
      subkey = GachaRecordsFetcherFragmentKind.Pagination
      options = { value: fragment.Pagination }
    } else if (GachaRecordsFetcherFragmentKind.DataRef in fragment) {
      // Just reuse Data
      subkey = GachaRecordsFetcherFragmentKind.Data
      options = { value: fragment.DataRef }
    } else if (GachaRecordsFetcherFragmentKind.Data in fragment) {
      subkey = GachaRecordsFetcherFragmentKind.Data
      options = { value: fragment.Data.length }
    } else if (GachaRecordsFetcherFragmentKind.Completed in fragment) {
      subkey = GachaRecordsFetcherFragmentKind.Completed
      options = { value: fragment.Completed, keyofBusinesses }
    } else {
      // HACK: should never reach here
      throw new Error('unreachable')
    }
  }

  return [
    `Pages.Gacha.LegacyView.Toolbar.Url.Fetch.Fragment.${subkey}`,
    options,
  ]
}
