import { MouseEventHandler, forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { Button, Checkbox, CheckboxProps, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Input, Radio, RadioGroup, RadioGroupProps, Switch, SwitchProps, makeStyles, tokens } from '@fluentui/react-components'
import { AttachRegular } from '@fluentui/react-icons'
import { useImmer } from 'use-immer'
import AppCommands from '@/api/commands/app'
import BusinessCommands, { ClassicSrgfWriterOptions, ClassicUigfWriterOptions, RecordsWriterFactory, RecordsWriterOptions, SupportedRecordsWriterFactories, SupportedRecordsWriterUigfVersions, UigfVersion, UigfWriterOptions } from '@/api/commands/business'
import errorTrans from '@/api/errorTrans'
import { Account, AccountBusiness } from '@/api/schemas/Account'
import { GachaRecord } from '@/api/schemas/GachaRecord'
import useNotifier, { DefaultNotifierTimeouts } from '@/hooks/useNotifier'
import { WithTrans, WithTransKnownNs, i18nDayjs, languageMetadata, useI18n, withTrans } from '@/i18n'
import capitalize from '@/utilities/capitalize'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  folderWrapper: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  folderInput: {
    flex: '1 0 auto',
  },
  factoryWrapper: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  factoryButton: {
    '&[aria-checked="true"]:not([disabled])': {
      color: tokens.colorPaletteBerryForeground1,
      border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteBerryForeground1}`,
    },
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacingVerticalM,
  },
  opener: {
    display: 'flex',
    // alignItems: 'center',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
})

export interface ConvertersExporterProps {
  business: AccountBusiness
  uid: Account['uid']
  preferLang?: GachaRecord<AccountBusiness>['lang'] | null
  onCancel?: MouseEventHandler
  onSuccess?: MouseEventHandler
}

function useExporter ({
  i18n, t, business, uid, preferLang, onSuccess,
}:
  & Pick<WithTrans, 'i18n' | 't'>
  & Pick<ConvertersExporterProps, 'business' | 'uid' | 'preferLang' | 'onSuccess'>,
) {
  const factories = SupportedRecordsWriterFactories[business]
  const uigfVersions = SupportedRecordsWriterUigfVersions[factories[0]]
  const lang = preferLang || languageMetadata(i18n.language).constants.gacha

  const notifier = useNotifier()
  const [state, produceState] = useImmer({
    error: null as string | null,
    folder: null as string | null,
    factory: factories[0],
    uigfVersion: uigfVersions[0],
    switchers: {
      pretty: false,
      minimized: false,
      withoutColumns: false,
    },
    opener: true,
    busy: false,
  })

  const handlePickFolder = useCallback<MouseEventHandler>(async () => {
    const folder = await AppCommands.pickFolder({})
    if (folder) {
      produceState((draft) => {
        draft.folder = folder
      })
    }
  }, [produceState])

  const handleFactoryChange = useCallback<MouseEventHandler<HTMLButtonElement>>((evt) => {
    const factory = evt.currentTarget.value as RecordsWriterFactory | null
    if (factory) {
      produceState((draft) => {
        draft.factory = factory

        // reset
        draft.uigfVersion = SupportedRecordsWriterUigfVersions[factory][0]
        Object.keys(draft.switchers).forEach((key) => {
          draft.switchers[key as keyof typeof draft.switchers] = false
        })
      })
    }
  }, [produceState])

  const handleUigfVersionChange = useCallback<Required<RadioGroupProps>['onChange']>((_, data) => {
    produceState((draft) => {
      draft.uigfVersion = data.value as UigfVersion
    })
  }, [produceState])

  const handleSwitchersChange = useCallback<Required<SwitchProps>['onChange']>((evt, data) => {
    const key = evt.currentTarget.getAttribute('data-key')
    if (key) {
      produceState((draft) => {
        draft.switchers[key as keyof typeof draft.switchers] = data.checked
      })
    }
  }, [produceState])

  const handleOpenerChange = useCallback<Required<CheckboxProps>['onChange']>((_, data) => {
    produceState((draft) => {
      draft.opener = data.checked as boolean
    })
  }, [produceState])

  const handleSubmit = useCallback<MouseEventHandler>(async (evt) => {
    const {
      folder,
      factory,
      uigfVersion,
      switchers: {
        pretty,
        minimized,
        withoutColumns,
      },
      opener,
    } = state

    if (!folder) {
      return
    }

    produceState((draft) => {
      draft.error = null
      draft.busy = true
    })

    const exportTime = new Date()

    let writer: RecordsWriterOptions
    switch (factory) {
      case RecordsWriterFactory.ClassicUigf:
        writer = {
          [factory]: {
            uigfVersion: uigfVersion as ClassicUigfWriterOptions['uigfVersion'],
            lang,
            uid,
            exportTime,
            pretty,
          },
        }
        break
      case RecordsWriterFactory.ClassicSrgf:
        writer = {
          [factory]: {
            srgfVersion: uigfVersion as ClassicSrgfWriterOptions['srgfVersion'],
            lang,
            uid,
            exportTime,
            pretty,
          },
        }
        break
      case RecordsWriterFactory.Uigf:
        writer = {
          [factory]: {
            uigfVersion: uigfVersion as UigfWriterOptions['uigfVersion'],
            businesses: { [business]: { [uid]: lang } } as UigfWriterOptions['businesses'],
            exportTime,
            pretty,
            minimized,
          },
        }
        break
      case RecordsWriterFactory.Csv:
        writer = {
          [factory]: {
            business,
            uid,
            withoutColumns,
          },
        }
        break
    }

    // ${APP_NAME}_${factory}_${uid}_${YYYYMMDD_HHmmss}
    const filename = [
      __APP_NAME__,
      factory,
      uid,
      i18nDayjs(i18n.language)(exportTime).format('YYYYMMDD_HHmmss'),
    ].join('_')

    let outputFile: string
    try {
      outputFile = await BusinessCommands.exportRecords({
        writer,
        output: folder,
        filename,
        opener,
      })
    } catch (error) {
      produceState((draft) => {
        draft.error = errorTrans(t, error)
        draft.busy = false
      })
      throw error
    }

    // Done
    produceState((draft) => {
      draft.error = null
      draft.busy = false
    })

    onSuccess?.(evt)
    notifier.success(t('Converters.Exporter.Success.Title'), {
      body: t('Converters.Exporter.Success.Body', {
        outputFile,
      }),
      timeout: DefaultNotifierTimeouts.success * 2,
      dismissible: true,
    })
  }, [business, i18n.language, lang, notifier, onSuccess, produceState, state, t, uid])

  return {
    ...state,
    handlePickFolder,
    handleFactoryChange,
    handleUigfVersionChange,
    handleSwitchersChange,
    handleOpenerChange,
    handleSubmit,
  }
}

const ConvertersExporterInner = withTrans.GachaPage(function ConvertersExporterInner (
  { i18n, t, business, uid, onCancel, onSuccess }:
    & WithTrans
    & ConvertersExporterProps,
) {
  const styles = useStyles()
  const {
    error,
    folder,
    factory,
    uigfVersion,
    switchers,
    opener,
    busy,
    handlePickFolder,
    handleFactoryChange,
    handleUigfVersionChange,
    handleSwitchersChange,
    handleOpenerChange,
    handleSubmit,
  } = useExporter({ i18n, t, business, uid, onSuccess })

  const hasUigfVersion = factory === RecordsWriterFactory.ClassicUigf
    || factory === RecordsWriterFactory.ClassicSrgf
    || factory === RecordsWriterFactory.Uigf

  const hasMinimized = factory === RecordsWriterFactory.Uigf
  const hasWithoutColumns = factory === RecordsWriterFactory.Csv

  return (
    <div className={styles.root}>
      <Field
        label={t('Converters.Exporter.Folder.Label')}
        validationState={error ? 'error' : 'none'}
        validationMessage={error}
        size="large"
        required
      >
        <div className={styles.folderWrapper}>
          <Input
            className={styles.folderInput}
            contentBefore={<AttachRegular />}
            placeholder={t('Converters.Exporter.Folder.Placeholder')}
            appearance="filled-darker"
            autoComplete="off"
            value={folder ?? ''}
            disabled={busy}
            readOnly
          />
          <Button onClick={handlePickFolder} disabled={busy} size="large">
            {t('Converters.Exporter.Folder.Select')}
          </Button>
        </div>
      </Field>
      <Field
        label={t('Converters.Factory.Label')}
        validationMessage={t(`Converters.Factory.${factory}.Info`, {
          versions: SupportedRecordsWriterUigfVersions[factory],
        })}
        validationState="success"
        size="large"
        required
      >
        <div className={styles.factoryWrapper}>
          {SupportedRecordsWriterFactories[business].map((value) => (
            <Button
              className={styles.factoryButton}
              key={value}
              value={value}
              aria-checked={value === factory}
              onClick={handleFactoryChange}
              disabled={busy}
              appearance="outline"
            >
              {t(`Converters.Factory.${value}.Text`)}
            </Button>
          ))}
        </div>
      </Field>
      {hasUigfVersion && (
        <Field label={t('Converters.Exporter.UigfVersion.Label')} size="large">
          <RadioGroup
            value={uigfVersion}
            onChange={handleUigfVersionChange}
            disabled={busy}
            layout="horizontal"
          >
            {SupportedRecordsWriterUigfVersions[factory].map((value) => (
              <Radio key={value} value={value} label={value} />
            ))}
          </RadioGroup>
        </Field>
      )}
      {([
        { predicate: hasMinimized, key: 'minimized' },
        { predicate: hasUigfVersion, key: 'pretty' },
        { predicate: hasWithoutColumns, key: 'withoutColumns' },
      ] as const).map((switcher) => {
        if (!switcher.predicate) {
          return null
        } else {
          const name = capitalize(switcher.key)
          const checked = switchers[switcher.key]

          return (
            <Field
              key={switcher.key}
              label={t(`Converters.Exporter.${name}.Label`)}
              validationMessage={t(`Converters.Exporter.${name}.Info`)}
              validationState={switcher.key === 'minimized' ? 'warning' : 'none'}
              size="large"
            >
              <Switch
                labelPosition="after"
                label={t(`Converters.Exporter.SwitchState`, {
                  context: String(checked),
                })}
                checked={checked}
                data-key={switcher.key}
                onChange={handleSwitchersChange}
                disabled={busy}
              />
            </Field>
          )
        }
      })}
      <div className={styles.actions}>
        <div className={styles.opener}>
          <Checkbox
            label={t('Converters.Exporter.Opener.Label')}
            checked={opener}
            onChange={handleOpenerChange}
            disabled={busy}
          />
        </div>
        <div className={styles.buttons}>
          <Button onClick={onCancel} disabled={busy}>
            {t('Converters.Exporter.Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={busy || !folder}
            appearance="primary"
          >
            {t('Converters.Exporter.Submit')}
          </Button>
        </div>
      </div>
    </div>
  )
})

const ConvertersExporter = forwardRef<
  { open (): void },
  Omit<ConvertersExporterProps, 'onCancel' | 'onSuccess'>
>(function ConvertersExporter (props, ref) {
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }), [])

  const { t } = useI18n(WithTransKnownNs.GachaPage)
  const close = useCallback(() => setOpen(false), [])

  return (
    <Dialog modalType="alert" open={open}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {t('Converters.Exporter.Title', {
              keyof: AccountBusiness[props.business],
            })}
          </DialogTitle>
          <DialogContent>
            <ConvertersExporterInner
              {...props}
              onCancel={close}
              onSuccess={close}
            />
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
})

export default ConvertersExporter
