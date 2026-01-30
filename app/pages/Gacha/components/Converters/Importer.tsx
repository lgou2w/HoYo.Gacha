import { MouseEventHandler, forwardRef, useCallback, useImperativeHandle, useState } from 'react'
import { Button, Dialog, DialogBody, DialogContent, DialogSurface, DialogTitle, Field, Input, ProgressBar, Radio, RadioGroup, RadioGroupProps, Select, SelectProps, makeStyles, tokens } from '@fluentui/react-components'
import { AttachRegular, InfoFilled } from '@fluentui/react-icons'
import { useQuery } from '@tanstack/react-query'
import { Channel } from '@tauri-apps/api/core'
import { useImmer } from 'use-immer'
import AppCommands from '@/api/commands/app'
import BusinessCommands, { RecordsReaderFactory, RecordsReaderOptions, SaveOnConflict, SupportedRecordsReaderFactories, SupportedRecordsReaderFactoryFilters, SupportedRecordsReaderUigfVersions, UigfReaderOptions } from '@/api/commands/business'
import MetadataCommands from '@/api/commands/metadata'
import errorTrans from '@/api/errorTrans'
import { Account, AccountBusiness } from '@/api/schemas/Account'
import { GachaRecord } from '@/api/schemas/GachaRecord'
import useNotifier, { DefaultNotifierTimeouts } from '@/hooks/useNotifier'
import { WithTrans, WithTransKnownNs, languageMetadata, useI18n, withTrans } from '@/i18n'
import { invalidatePrettizedRecordsQuery } from '@/pages/Gacha/queries/prettizedRecords'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  fileWrapper: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  fileInput: {
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
  chooseLangIcon: {
    color: tokens.colorBrandForeground1,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacingVerticalM,
  },
  progress: {
    display: 'flex',
    alignItems: 'center',
    flexBasis: '30%',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
})

export interface ConvertersImporterProps {
  business: AccountBusiness
  uid: Account['uid']
  preferLang?: GachaRecord<AccountBusiness>['lang'] | null
  onCancel?: MouseEventHandler
  onSuccess?: MouseEventHandler
}

function useImporter ({
  i18n, t, business, uid, preferLang, onSuccess,
}:
  & Pick<WithTrans, 'i18n' | 't'>
  & Pick<ConvertersImporterProps, 'business' | 'uid' | 'preferLang' | 'onSuccess'>,
) {
  const factories = SupportedRecordsReaderFactories[business]
  const currentGachaLang = languageMetadata(i18n.language).constants.gacha

  const notifier = useNotifier()
  const [state, produceState] = useImmer({
    error: null as string | null,
    file: null as string | null,
    factory: factories[0],
    chooseLang: preferLang ?? currentGachaLang,
    saveOnConflict: SaveOnConflict.Nothing,
    progress: undefined as number | undefined, // 0. ~ 1.
    busy: false,
  })

  const shouldChooseLang = !preferLang
    && (state.factory === RecordsReaderFactory.ClassicUigf
      || state.factory === RecordsReaderFactory.Uigf)

  const availableLangsQuery = useQuery({
    enabled: shouldChooseLang,
    staleTime: 60 * 1000, // 60s
    queryKey: ['ConvertersImporter', 'AvailableLangs', AccountBusiness[business]],
    queryFn: async function availableLangsFn () {
      const locales = await MetadataCommands.locales({ business })
      locales?.sort((a, b) => a.localeCompare(b))
      return locales
    },
  })

  const handlePickFile = useCallback<MouseEventHandler>(async () => {
    const file = await AppCommands.pickFile({
      filters: SupportedRecordsReaderFactoryFilters[state.factory],
    })

    if (file) {
      produceState((draft) => {
        draft.file = file
      })
    }
  }, [produceState, state.factory])

  const handleFactoryChange = useCallback<MouseEventHandler<HTMLButtonElement>>((evt) => {
    const factory = evt.currentTarget.value as RecordsReaderFactory | null
    if (factory) {
      produceState((draft) => {
        draft.factory = factory
      })
    }
  }, [produceState])

  const handleSaveOnConflictChange = useCallback<Required<RadioGroupProps>['onChange']>((_, data) => {
    produceState((draft) => {
      draft.saveOnConflict = data.value as SaveOnConflict
    })
  }, [produceState])

  const handleChooseLangChange = useCallback<Required<SelectProps>['onChange']>((_, data) => {
    produceState((draft) => {
      draft.chooseLang = data.value
    })
  }, [produceState])

  const handleSubmit = useCallback<MouseEventHandler>(async (evt) => {
    const {
      file,
      factory,
      chooseLang,
      saveOnConflict,
    } = state

    if (!file) {
      return
    }

    produceState((draft) => {
      draft.error = null
      draft.busy = true
    })

    let reader: RecordsReaderOptions
    switch (factory) {
      case RecordsReaderFactory.ClassicUigf:
        reader = {
          [factory]: {
            lang: chooseLang!,
            uid,
          },
        }
        break
      case RecordsReaderFactory.ClassicSrgf:
        reader = {
          [factory]: {
            uid,
          },
        }
        break
      case RecordsReaderFactory.Uigf:
        reader = {
          [factory]: {
            businesses: { [business]: { [uid]: chooseLang } } as UigfReaderOptions['businesses'],
          },
        }
        break
    }

    const progressChannel = new Channel<number>((progress) => {
      produceState((draft) => {
        draft.progress = progress
      })
    })

    let changes: number
    try {
      changes = await BusinessCommands.importRecords({
        input: file,
        reader,
        saveOnConflict,
        progressChannel,
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
    notifier.success(t('Converters.Importer.Success.Title'), {
      body: t('Converters.Importer.Success.Body', {
        changes,
      }),
      timeout: DefaultNotifierTimeouts.success * 2,
      dismissible: true,
    })

    // Invalidate the prettized records query if changes were made
    if (changes > 0) {
      invalidatePrettizedRecordsQuery(business, uid, currentGachaLang)
    }
  }, [business, currentGachaLang, notifier, onSuccess, produceState, state, t, uid])

  return {
    ...state,
    shouldChooseLang,
    availableLangsQuery,
    handlePickFile,
    handleFactoryChange,
    handleSaveOnConflictChange,
    handleChooseLangChange,
    handleSubmit,
  }
}

const ConvertersImporterInner = withTrans.GachaPage(function ConvertersImporterInner (
  { i18n, t, business, uid, preferLang, onCancel, onSuccess }:
    & WithTrans
    & ConvertersImporterProps,
) {
  const styles = useStyles()
  const {
    error,
    file,
    factory,
    chooseLang,
    saveOnConflict,
    progress,
    busy,
    shouldChooseLang,
    availableLangsQuery,
    handlePickFile,
    handleFactoryChange,
    handleSaveOnConflictChange,
    handleChooseLangChange,
    handleSubmit,
  } = useImporter({ i18n, t, business, uid, preferLang, onSuccess })

  return (
    <div className={styles.root}>
      <Field
        label={t('Converters.Importer.File.Label')}
        validationState={error ? 'error' : 'none'}
        validationMessage={error}
        size="large"
        required
      >
        <div className={styles.fileWrapper}>
          <Input
            className={styles.fileInput}
            contentBefore={<AttachRegular />}
            placeholder={t('Converters.Importer.File.Placeholder')}
            appearance="filled-darker"
            autoComplete="off"
            value={file ?? ''}
            disabled={busy}
            readOnly
          />
          <Button onClick={handlePickFile} disabled={busy} size="large">
            {t('Converters.Importer.File.Select')}
          </Button>
        </div>
      </Field>
      <Field
        label={t('Converters.Factory.Label')}
        validationMessage={t(`Converters.Factory.${factory}.Info`, {
          versions: SupportedRecordsReaderUigfVersions[factory],
        })}
        validationState="success"
        size="large"
        required
      >
        <div className={styles.factoryWrapper}>
          {SupportedRecordsReaderFactories[business].map((value) => (
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
      {shouldChooseLang && (
        <Field
          label={t('Converters.Importer.ChooseLang.Label')}
          validationMessage={t('Converters.Importer.ChooseLang.Info')}
          validationMessageIcon={<InfoFilled className={styles.chooseLangIcon} />}
          validationState="none"
          size="large"
        >
          <Select
            appearance="filled-darker"
            value={chooseLang}
            onChange={handleChooseLangChange}
            disabled={busy}
          >
            {availableLangsQuery.data?.map((locale) => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field
        label={t('Converters.Importer.SaveOnConflict.Label')}
        size="large"
      >
        <RadioGroup
          layout="horizontal"
          value={saveOnConflict}
          onChange={handleSaveOnConflictChange}
          disabled={busy}
        >
          {Object.values(SaveOnConflict).map((value) => (
            <Radio
              key={value}
              value={value}
              label={t(`Converters.Importer.SaveOnConflict.${value}`)}
            />
          ))}
        </RadioGroup>
      </Field>
      <div className={styles.actions}>
        <div className={styles.progress}>
          {busy && (
            <ProgressBar value={progress} max={1} thickness="large" />
          )}
        </div>
        <div className={styles.buttons}>
          <Button onClick={onCancel} disabled={busy}>
            {t('Converters.Importer.Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={busy || !file}>
            {t('Converters.Importer.Submit')}
          </Button>
        </div>
      </div>
    </div>
  )
})

const ConvertersImporter = forwardRef<
  { open (): void },
  Omit<ConvertersImporterProps, 'onCancel' | 'onSuccess'>
>(function ConvertersImporter (props, ref) {
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
            {t('Converters.Importer.Title', {
              keyof: AccountBusiness[props.business],
            })}
          </DialogTitle>
          <DialogContent>
            <ConvertersImporterInner
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

export default ConvertersImporter
