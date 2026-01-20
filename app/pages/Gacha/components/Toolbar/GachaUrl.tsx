import { MouseEventHandler, ReactNode, useCallback, useRef, useState } from 'react'
import { Body1, Caption2, Dialog, DialogSurface, Field, Input, Menu, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuList, MenuPopover, MenuTrigger, Spinner, SplitButton, Tooltip, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { ArrowClockwiseRegular, ArrowSyncRegular, LinkEditRegular, LinkRegular } from '@fluentui/react-icons'
import { produce } from 'immer'
import BusinessCommands, { FetchRecordsArgs, FetchRecordsEvent, FetchRecordsEventKind, GachaUrlRequestErrorKind, GachaUrl as IGachaUrl, SaveToDatabase, isGachaUrlRequestError } from '@/api/commands/business'
import errorTrans from '@/api/errorTrans'
import { Account, AccountBusiness, KeyofAccountBusiness } from '@/api/schemas/Account'
import CopyButton from '@/components/CopyButton'
import useNotifier, { DefaultNotifierTimeouts } from '@/hooks/useNotifier'
import useRecordsFetcher from '@/hooks/useRecordsFetcher'
import { Language, TFunction, WithTrans, i18nDayjs, languageMetadata, withTrans } from '@/i18n'
import ToolbarContainer from '@/pages/Gacha/components/Toolbar/Container'
import { useBusiness } from '@/pages/Gacha/contexts/Business'
import { PrettizedCategory, PrettizedRecords } from '@/pages/Gacha/contexts/PrettizedRecords'
import { useSelectedAccount, useUpdateAccountPropertiesMutation } from '@/pages/Gacha/queries/accounts'
import { invalidatePrettizedRecordsQuery, usePrettizedRecordsSuspenseQuery } from '@/pages/Gacha/queries/prettizedRecords'
import dayjs from '@/utilities/dayjs'

export default function GachaUrl () {
  return (
    <ToolbarContainer
      icon={LinkRegular}
      label={<GachaUrlLabel />}
    >
      <UserInput />
      <UserAction />
    </ToolbarContainer>
  )
}

function computeDeadline (
  language: Language | string,
  selected: Account | null | undefined,
) {
  const { gachaUrl: value, gachaUrlCreationTime: creationTime } = selected?.properties || {}

  // HACK: The Gacha url is valid for 1 day.
  const deadline = creationTime
    ? i18nDayjs(language)(creationTime).add(1, 'day')
    : undefined

  // If deadline is defined and is before now, it has expired.
  const hasExpired = !!deadline && deadline.isBefore()

  return {
    value,
    deadline,
    hasExpired,
  }
}

// #region: Label

const useGachaUrlLabelStyles = makeStyles({
  deadline: {
    marginLeft: tokens.spacingHorizontalS,
    color: tokens.colorBrandForeground2,
    borderBottom: `${tokens.strokeWidthThin} dashed ${tokens.colorBrandStroke2}`,
    cursor: 'help',
  },
  deadLineExpired: {
    color: tokens.colorPaletteRedForeground1,
    borderBottomColor: tokens.colorPaletteRedForeground1,
    cursor: 'not-allowed',
  },
})

const GachaUrlLabel = withTrans.GachaPage(function ({ i18n, t }: WithTrans) {
  const styles = useGachaUrlLabelStyles()
  const business = useBusiness()
  const selected = useSelectedAccount(business.keyof)
  const url = computeDeadline(i18n.language, selected)

  let deadline: ReactNode
  if (url.deadline && url.hasExpired) {
    deadline = (
      <Caption2 className={mergeClasses(styles.deadline, styles.deadLineExpired)}>
        {t('Toolbar.GachaUrl.Expired')}
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
})

// #endregion

// #region: User input

const useUserInputStyles = makeStyles({
  root: {
    maxWidth: '12rem',
    paddingRight: tokens.spacingHorizontalXS,
  },
  inputExpired: {
    color: tokens.colorPaletteRedForeground1,
  },
  inputValid: {
    color: tokens.colorBrandForeground2,
  },
})

const UserInput = withTrans.GachaPage(function ({ i18n, t }: WithTrans) {
  const styles = useUserInputStyles()
  const business = useBusiness()
  const selected = useSelectedAccount(business.keyof)
  const url = computeDeadline(i18n.language, selected)

  return (
    <Field validationState={url.hasExpired ? 'error' : undefined}>
      <Input
        className={styles.root}
        input={{ className: url.hasExpired ? styles.inputExpired : styles.inputValid }}
        contentAfter={(
          <CopyButton
            content={url.value}
            disabled={!url.value}
            appearance="subtle"
            shape="circular"
          />
        )}
        value={url.value || ''}
        placeholder={t('Toolbar.GachaUrl.Placeholder', { keyof: business.keyof })}
        appearance="outline"
        size="large"
        readOnly
      />
    </Field>
  )
})

// #endregion

// #region: User action

const useUserActionStyles = makeStyles({
  fetcher: {
    maxWidth: '20rem',
  },
  fetcherWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: tokens.spacingVerticalM,
  },
})

const DatasetUserActionType = 'data-action'

const UserAction = withTrans.GachaPage(function ({ i18n, t }: WithTrans) {
  const styles = useUserActionStyles()
  const { business, isFetching, fetchEvent, disabled, update } = useUserAction(i18n.language, t)

  return (
    <>
      <Menu positioning="below-end">
        <MenuTrigger disableButtonEnhancement>
          {(triggerProps) => (
            <SplitButton
              icon={<ArrowClockwiseRegular />}
              menuButton={triggerProps}
              primaryActionButton={{
                onClick: update,
                ...{ [DatasetUserActionType]: SaveToDatabase.Yes },
              }}
              disabled={disabled}
              appearance="primary"
              size="large"
            >
              {t('Toolbar.GachaUrl.UpdateBtn')}
            </SplitButton>
          )}
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuGroupHeader>
              {t('Toolbar.GachaUrl.More.Label')}
            </MenuGroupHeader>
            <MenuGroup>
              <MenuItem
                icon={<ArrowSyncRegular />}
                onClick={update}
                {...{ [DatasetUserActionType]: SaveToDatabase.FullUpdate }}
              >
                {t('Toolbar.GachaUrl.More.FullUpdate')}
              </MenuItem>
            </MenuGroup>
            <MenuDivider />
            <MenuGroup>
              <MenuItem icon={<LinkEditRegular />}>
                {t('Toolbar.GachaUrl.More.ManualInput')}
              </MenuItem>
            </MenuGroup>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Dialog modalType="alert" surfaceMotion={null} open={isFetching}>
        <DialogSurface className={styles.fetcher}>
          <div className={styles.fetcherWrapper}>
            <Spinner />
            <Body1>
              {stringifyFetcherEvent(business.keyof, fetchEvent, t)}
            </Body1>
          </div>
        </DialogSurface>
      </Dialog>
    </>
  )
})

function stringifyFetcherEvent (
  keyof: KeyofAccountBusiness,
  event: FetchRecordsEvent | null,
  t: TFunction,
): string {
  let subkey: string
  let options: Record<string, unknown> | undefined

  if (!event) {
    subkey = 'Idle'
  } else if (typeof event === 'string') {
    subkey = event
  } else if (FetchRecordsEventKind.Ready in event) {
    subkey = FetchRecordsEventKind.Ready
    options = { value: event.Ready, keyof }
  } else if (FetchRecordsEventKind.Pagination in event) {
    subkey = FetchRecordsEventKind.Pagination
    options = { value: event.Pagination }
  } else if (FetchRecordsEventKind.Data in event) {
    subkey = FetchRecordsEventKind.Data
    options = { value: event.Data }
  } else if (FetchRecordsEventKind.Completed in event) {
    subkey = FetchRecordsEventKind.Completed
    options = { value: event.Completed, keyof }
  } else {
    // HACK: should never reach here
    throw new Error('unreachable')
  }

  return t(`Toolbar.GachaUrl.Fetch.Event.${subkey}`, options)
}

function useUserAction (language: Language | string, t: TFunction) {
  const business = useBusiness()
  const selected = useSelectedAccount(business.keyof)
  const customLocale = languageMetadata(language).constants.gacha
  const url = computeDeadline(language, selected)

  const notifier = useNotifier()
  const fetcher = useRecordsFetcher()
  const prettized = usePrettizedRecordsSuspenseQuery(
    business.value,
    selected?.uid,
    customLocale,
  )

  const [isBusy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const disabled
    = !selected
      || !prettized.data
      || fetcher.isFetching
      || isBusy

  const badDataFolderCounterRef = useRef<number>(0)
  const updateAccountPropertiesMutation = useUpdateAccountPropertiesMutation()
  const update = useCallback<MouseEventHandler>(async (evt) => {
    const saveToDatabase = evt
      .currentTarget
      .getAttribute(DatasetUserActionType) as SaveToDatabase | null

    // Need dataset property
    if (!saveToDatabase) {
      return
    }

    // Invalid state or busy
    if (!selected || !prettized.data || busyRef.current) {
      return
    }

    busyRef.current = true
    setBusy(true)

    // Clone selected account properties, Need to modify
    const properties = Object.assign({}, selected.properties)

    // The URL already contains the calculated properties status value; see above.
    // url.value === properties.gachaUrl
    if (url.value && url.hasExpired) {
      console.info('Gacha URL is expired, need to reobtain...')
      properties.gachaUrl = null
      properties.gachaUrlCreationTime = null
    }

    // Reobtain gacha url if need
    if (!properties.gachaUrl) {
      const promise = notifier.promise(BusinessCommands.fromWebcachesGachaUrl({
        business: business.value,
        uid: selected.uid,
        dataFolder: selected.dataFolder,
      }), {
        loading: {
          title: t('Toolbar.GachaUrl.Obtain.Loading', { keyof: business.keyof }),
        },
        error (error) {
          return {
            title: t('Toolbar.GachaUrl.Obtain.Error', { keyof: business.keyof }),
            body: errorTrans(t, error),
            timeout: DefaultNotifierTimeouts.error * 2,
            dismissible: true,
          }
        },
      })

      let gachaUrl: IGachaUrl<AccountBusiness>
      try {
        gachaUrl = await promise
        properties.gachaUrl = gachaUrl.value
        properties.gachaUrlCreationTime = gachaUrl.creationTime
      } catch (error) {
        if (isGachaUrlRequestError(error) && error.details.kind === GachaUrlRequestErrorKind.AuthkeyTimeout) {
          // Expired, remove fields
          properties.gachaUrl = null
          properties.gachaUrlCreationTime = null
        }

        // break
        busyRef.current = false
        setBusy(false)
        throw error
      } finally {
        // Update
        await updateAccountPropertiesMutation.mutateAsync({
          business: business.value,
          uid: selected.uid,
          properties,
        })
      }
    }

    const promise = notifier.promise(fetcher.fetch({
      business: business.value,
      uid: selected.uid,
      gachaUrl: properties.gachaUrl,
      gachaTypeAndLastEndIds: computeGachaTypeAndLastEndIds(prettized.data),
      saveToDatabase,
    }), {
      loading: {
        title: t('Toolbar.GachaUrl.Fetch.Loading', { keyof: business.keyof }),
      },
      success (changes) {
        // Positive numbers are added, negative numbers are deleted
        changes ??= 0
        const body = changes >= 0 ? 'AddedBody' : 'DeletedBody'
        return {
          title: t('Toolbar.GachaUrl.Fetch.Success.Title', { keyof: business.keyof }),
          body: t(`Toolbar.GachaUrl.Fetch.Success.${body}`, {
            changes: Math.abs(changes),
          }),
          timeout: DefaultNotifierTimeouts.success * 2,
          dismissible: true,
        }
      },
      error (error) {
        return {
          title: t('Toolbar.GachaUrl.Fetch.Error', { keyof: business.keyof }),
          body: errorTrans(t, error),
          timeout: DefaultNotifierTimeouts.error * 2,
          dismissible: true,
        }
      },
    })

    // Fetch records
    let changes: number
    try {
      changes = await promise ?? 0
    } catch (error) {
      if (isGachaUrlRequestError(error) && error.details.kind === GachaUrlRequestErrorKind.AuthkeyTimeout) {
        // Expired, remove fields
        properties.gachaUrl = null
        properties.gachaUrlCreationTime = null
        await updateAccountPropertiesMutation.mutateAsync({
          business: business.value,
          uid: selected.uid,
          properties,
        })
      }

      // break
      busyRef.current = false
      setBusy(false)
      throw error
    }

    const lastGachaRecordsUpdated = dayjs().toISOString()
    await updateAccountPropertiesMutation.mutateAsync({
      business: business.value,
      uid: selected.uid,
      properties: produce(properties, (draft) => {
        draft.lastGachaRecordsUpdated = lastGachaRecordsUpdated
      }),
    })

    // HACK: Invalidate the gacha records if there are changes
    if (changes !== 0) {
      console.debug('Invalidating prettized gacha records cache...')
      invalidatePrettizedRecordsQuery(business.value, selected.uid, customLocale)
    }

    // Done
    badDataFolderCounterRef.current = 0
    busyRef.current = false
    setBusy(false)
  }, [
    selected,
    prettized.data,
    url,
    business,
    updateAccountPropertiesMutation,
    notifier,
    t,
    fetcher,
    customLocale,
  ])

  return {
    business,
    isBusy,
    isFetching: fetcher.isFetching,
    fetchEvent: fetcher.event,
    disabled,
    update,
  }
}

function computeGachaTypeAndLastEndIds (
  prettized: PrettizedRecords<AccountBusiness>,
  excludeBeginner = true,
) {
  const results: FetchRecordsArgs<AccountBusiness>['gachaTypeAndLastEndIds'] = []

  for (const category in prettized.categorizeds) {
    const categorized = prettized.categorizeds[category as PrettizedCategory]
    if (!categorized) {
      continue
    }

    const isBeginner = categorized.category === PrettizedCategory.Beginner
    if (isBeginner && excludeBeginner) {
      // HACK:
      //   Genshin Impact    : Beginner Gacha Banner = 20 times
      //   Honkai: Star Rail :                       = 50 times
      //   Zenless Zone Zero : Useless
      const exclude
        = (prettized.business === AccountBusiness.GenshinImpact && categorized.total >= 20)
          || (prettized.business === AccountBusiness.HonkaiStarRail && categorized.total >= 50)

      if (exclude) {
        console.debug('Exclude beginner banner, because it has reached the limit')
        continue
      }
    }

    results.push([
      categorized.gachaType,
      categorized.lastEndId,
    ])
  }

  return results
}

// #endregion
