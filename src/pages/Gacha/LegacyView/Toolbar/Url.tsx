import React, { ElementRef, Fragment, forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Body1, Button, Caption1, Caption2, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Input, Menu, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuList, MenuPopover, MenuTrigger, Spinner, SplitButton, Textarea, Tooltip, inputClassNames, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { ArrowClockwiseRegular, ArrowSyncRegular, CopyRegular, LinkEditRegular, LinkRegular } from '@fluentui/react-icons'
import * as clipboard from '@tauri-apps/plugin-clipboard-manager'
import { produce } from 'immer'
import { GachaRecordsFetcherFragmentKind, GachaUrl, GachaUrlErrorKind, fromDirtyGachaUrl, fromWebCachesGachaUrl, isGachaUrlError } from '@/api/commands/business'
import errorTranslation from '@/api/errorTranslation'
import { useSelectedAccountSuspenseQueryData, useUpdateAccountPropertiesMutation } from '@/api/queries/accounts'
import { invalidateFirstGachaRecordQuery, invalidatePrettizedGachaRecordsQuery, usePrettizedGachaRecordsSuspenseQueryData } from '@/api/queries/business'
import Locale, { LocaleMapping } from '@/components/Locale'
import useBusinessContext from '@/hooks/useBusinessContext'
import useGachaRecordsFetcher, { GachaRecordsFetcherFetchArgs, GachaRecordsFetcherFetchFragment } from '@/hooks/useGachaRecordsFetcher'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import { KnownAccountProperties } from '@/interfaces/Account'
import { Business, KeyofBusinesses, detectUidBusinessRegion } from '@/interfaces/Business'
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
  const i18n = useI18n()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const prettized = usePrettizedGachaRecordsSuspenseQueryData(business, selectedAccount?.uid, i18n.constants.gacha)

  const [isBusy, setBusy] = useState(false)
  const updateAccountPropertiesMutation = useUpdateAccountPropertiesMutation()
  const gachaRecordsFetcher = useGachaRecordsFetcher()
  const notifier = useNotifier()

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
    const region = detectUidBusinessRegion(business, uid)! // FIXME: Maybe null
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
          dataFolder: selectedAccount.dataFolder,
          expectedUid: uid,
        }), {
          loading: {
            title: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Obtain.Loading', { keyofBusinesses }),
          },
          error: (error) => {
            return {
              title: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Obtain.Error', { keyofBusinesses }),
              body: errorTranslation(i18n, error),
              timeout: notifier.DefaultTimeouts.error * 2,
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
            timeout: notifier.DefaultTimeouts.success * 2,
            dismissible: true,
          }
        },
        error: (error) => {
          return {
            title: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.Fetch.Error', { keyofBusinesses }),
            body: errorTranslation(i18n, error),
            timeout: notifier.DefaultTimeouts.error * 2,
            dismissible: true,
          }
        },
      }) ?? 0
    } catch (error) {
      if (isGachaUrlError(error) && error.details.kind === GachaUrlErrorKind.AuthkeyTimeout) {
        // Expired, remove fields
        properties.gachaUrl = null
        properties.gachaUrlCreationTime = null
        await updateAccountPropertiesMutation.mutateAsync({
          business,
          uid,
          properties,
        })
      }

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

    // HACK: Invalidate the gacha records if there are changes
    if (changes !== 0) {
      console.debug('Invalidating prettized gacha records cache...')
      invalidatePrettizedGachaRecordsQuery(selectedAccount.business, selectedAccount.uid, i18n.constants.gacha)
      invalidateFirstGachaRecordQuery(selectedAccount.business, selectedAccount.uid)
    }

    setBusy(false)
  }, [gachaRecordsFetcher, i18n, keyofBusinesses, notifier, prettized, selectedAccount, updateAccountPropertiesMutation])

  const manualInputDialogRef = useRef<ElementRef<typeof UrlManualInputDialog>>(null)
  const handleManualInputClick = useCallback(() => {
    manualInputDialogRef.current?.setOpen(true)
  }, [])

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
                onClick={handleManualInputClick}
                mapping={['Pages.Gacha.LegacyView.Toolbar.Url.ManualInputBtn']}
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
      <UrlManualInputDialog
        ref={manualInputDialogRef}
        business={business}
        keyofBusinesses={keyofBusinesses}
      />
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

const useUrlManualInputDialogStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
  },
})

// HACK: See -> src-tauri/src/business/gacha_url.rs
const GachaUrlRegex = /^https:\/\/.*(mihoyo.com|hoyoverse.com).*\?.*(authkey=.+).*$/i
const GachaUrlExample = 'https://*.mihoyo|hoyoverse.com/xxx?authkey=yourauthkey&fullParamsGachaUrl'

const UrlManualInputDialog = forwardRef<{
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}, {
  business: Business
  keyofBusinesses: KeyofBusinesses
}>(function UrlManualInputDialog (props, ref) {
  const styles = useUrlManualInputDialogStyles()
  const { business, keyofBusinesses } = props
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    setOpen,
  }))

  type FormData = { url: string }

  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const updateAccountPropertiesMutation = useUpdateAccountPropertiesMutation()
  const i18n = useI18n()

  const {
    register,
    resetField,
    setError,
    handleSubmit,
    formState: { isValid, isSubmitting, errors },
  } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: { url: '' },
    values: { url: '' },
  })

  const handleCancel = useCallback(() => {
    resetField('url')
    setOpen(false)
  }, [resetField])

  const onSubmit = useCallback<SubmitHandler<FormData>>(async (data) => {
    // HACK: When unavailable, the parent component is disabled
    if (!selectedAccount) {
      return
    }

    const expectedUid = selectedAccount.uid
    const properties = { ...selectedAccount.properties } // Need to modify

    let gachaUrl: GachaUrl<Business>
    try {
      gachaUrl = await fromDirtyGachaUrl({
        dirtyUrl: data.url,
        expectedUid,
      })
    } catch (error) {
      const message = errorTranslation(i18n, error)
      setError('url', { message })
      throw error
    }

    properties.gachaUrl = gachaUrl.value
    properties.gachaUrlCreationTime = null
    // Dirty URLs have no creation date and cannot know their validity period.
    await updateAccountPropertiesMutation.mutateAsync({
      business,
      uid: expectedUid,
      properties,
    })

    resetField('url')
    setOpen(false)
  }, [business, i18n, resetField, selectedAccount, setError, updateAccountPropertiesMutation])

  return (
    <Dialog
      modalType="alert"
      open={open}
    >
      <DialogSurface>
        <DialogBody>
          <Locale
            component={DialogTitle}
            mapping={['Pages.Gacha.LegacyView.Toolbar.Url.ManualInputDialog.Title']}
          />
          <DialogContent>
            <form
              className={styles.form}
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <Field
                size="large"
                validationState={errors.url ? 'error' : isValid ? 'success' : 'none'}
                validationMessage={errors.url ? errors.url.message : undefined}
                required
              >
                <Textarea
                  placeholder={i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.ManualInputDialog.Placeholder', { example: GachaUrlExample })}
                  autoComplete="off"
                  appearance="filled-darker"
                  rows={6}
                  required
                  {...register('url', {
                    required: i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.ManualInputDialog.Required'),
                    validate (value) {
                      if (!value || !GachaUrlRegex.test(value)) {
                        return i18n.t('Pages.Gacha.LegacyView.Toolbar.Url.ManualInputDialog.Validate')
                      }
                    },
                  })}
                />
              </Field>
              <div className={styles.actions}>
                <Locale
                  component={Button}
                  appearance="secondary"
                  disabled={isSubmitting}
                  onClick={handleCancel}
                  mapping={['Pages.Gacha.LegacyView.Toolbar.Url.ManualInputDialog.CancelBtn']}
                />
                <Locale
                  component={Button}
                  appearance="primary"
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  mapping={['Pages.Gacha.LegacyView.Toolbar.Url.ManualInputDialog.SubmitBtn']}
                />
              </div>
            </form>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
})
