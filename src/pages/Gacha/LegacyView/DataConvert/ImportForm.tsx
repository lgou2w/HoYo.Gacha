import React, { ComponentProps, MouseEventHandler, useCallback, useMemo } from 'react'
import { Button, Field, Input, ProgressBar, Radio, RadioGroup, Select, makeStyles, tokens } from '@fluentui/react-components'
import { AttachRegular, InfoFilled } from '@fluentui/react-icons'
import { listen } from '@tauri-apps/api/event'
import { useImmer } from 'use-immer'
import { ImportGachaRecordsArgs, importGachaRecords } from '@/api/commands/business'
import { pickFile } from '@/api/commands/core'
import errorTranslation from '@/api/errorTranslation'
import { useSelectedAccountSuspenseQueryData } from '@/api/queries/accounts'
import { invalidateFirstGachaRecordQuery, invalidatePrettizedGachaRecordsQuery, useFirstGachaRecordSuspenseQueryData } from '@/api/queries/business'
import Locale from '@/components/Locale'
import useBusinessContext from '@/hooks/useBusinessContext'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import { Language } from '@/i18n/locales'
import { Business, Businesses } from '@/interfaces/Business'
import { KeyofUnion } from '@/interfaces/declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  fileContainer: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  fileInput: {
    flexGrow: 1,
  },
  formatContainer: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  formatButton: {
    '&[aria-checked="true"]:not([disabled])': {
      color: tokens.colorPaletteBerryForeground1,
      border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteBerryForeground1}`,
    },
  },
  localeIcon: {
    color: tokens.colorBrandForeground1,
  },
  bottom: {
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
  actions: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
})

interface Props {
  onCancel?: () => void
  onSuccess?: (changes: number) => void
}

type SupportedFormat = KeyofUnion<ImportGachaRecordsArgs['importer']>
const SupportedFormats: Record<Business, SupportedFormat[]> = {
  [Businesses.GenshinImpact]: ['Uigf', 'LegacyUigf'],
  [Businesses.HonkaiStarRail]: ['Uigf', 'Srgf'],
  [Businesses.ZenlessZoneZero]: ['Uigf'],
}

type SaveOnConflict = Required<ImportGachaRecordsArgs>['saveOnConflict']
const SaveOnConflicts: SaveOnConflict[] = ['Nothing', 'Update']

const GachaLocales = [
  'de-de', 'en-us', 'es-es', 'fr-fr', 'id-id', 'it-it', 'ja-jp',
  'ko-kr', 'pt-pt', 'ru-ru', 'th-th', 'tr-tr', 'vi-vn',
  'zh-cn', 'zh-tw',
] as const

type SupportedGachaLocale = typeof GachaLocales[number]

function preferredGachaLocale (language: Language): SupportedGachaLocale {
  switch (language) {
    case 'zh-Hans': return 'zh-cn'
    case 'zh-Hant': return 'zh-tw'
    default: return 'en-us'
  }
}

export default function GachaLegacyViewDataConvertImportForm (props: Props) {
  const styles = useStyles()
  const { onCancel, onSuccess } = props

  const { business, keyofBusinesses } = useBusinessContext()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const firstGachaRecord = useFirstGachaRecordSuspenseQueryData(business, selectedAccount?.uid)
  const supportedFormats = useMemo(() => SupportedFormats[business], [business])
  const i18n = useI18n()
  const notifier = useNotifier()

  const [state, produce] = useImmer({
    file: null as string | null,
    fileError: null as string | null,
    format: supportedFormats[0],
    formatUigfLocale: firstGachaRecord?.lang || preferredGachaLocale(i18n.language),
    saveOnConflict: 'Nothing' as SaveOnConflict,
    progress: undefined as number | undefined,
    busy: false,
  })

  const onSelectFile = useCallback(async () => {
    const file = await pickFile({
      filters: [
        ['JSON', ['json']],
      ],
    })

    file && produce((draft) => {
      draft.file = file
    })
  }, [produce])

  const onFormatChange = useCallback<MouseEventHandler<HTMLButtonElement>>((evt) => {
    const newFormat = evt.currentTarget.value as SupportedFormat
    produce((draft) => {
      draft.format = newFormat
    })
  }, [produce])

  const onSaveOnConflictChange = useCallback<Required<ComponentProps<typeof RadioGroup>>['onChange']>((_, data) => {
    produce((draft) => {
      draft.saveOnConflict = data.value as SaveOnConflict
    })
  }, [produce])

  const onSubmit = useCallback(async () => {
    if (!selectedAccount || !state.file) {
      return
    }

    let importer: ImportGachaRecordsArgs['importer']
    switch (state.format) {
      case 'Uigf':
        importer = {
          [state.format]: {
            businesses: [selectedAccount.business],
            accounts: { [selectedAccount.uid]: state.formatUigfLocale },
          },
        }
        break
      case 'LegacyUigf':
        importer = {
          [state.format]: {
            expectedUid: selectedAccount.uid,
            expectedLocale: state.formatUigfLocale,
          },
        }
        break
      case 'Srgf':
        importer = {
          [state.format]: { expectedUid: selectedAccount.uid },
        }
        break
      default:
        return
    }

    produce((draft) => {
      draft.fileError = null
      draft.busy = true
    })

    const progressChannel = 'DATACONVERT_PROGRESSCHANNEL_IMPORT' + Math.random().toString().replace('.', '_')

    let changes: number
    try {
      const unlisten = await listen<number>(progressChannel, (event) => {
        produce((draft) => {
          draft.progress = event.payload
        })
      })

      try {
        changes = await importGachaRecords({
          input: state.file,
          importer,
          saveOnConflict: state.saveOnConflict,
          progressChannel,
        })
      } finally {
        unlisten()
      }
    } catch (error) {
      produce((draft) => {
        draft.fileError = errorTranslation(i18n, error)
        draft.busy = false
      })

      throw error
    }

    produce((draft) => {
      draft.busy = false
    })

    onSuccess?.(changes)

    notifier.success(i18n.t('Pages.Gacha.LegacyView.DataConvert.ImportForm.Success.Title'), {
      body: i18n.t('Pages.Gacha.LegacyView.DataConvert.ImportForm.Success.Body', {
        changes,
      }),
    })

    // HACK: If the change is greater than 0, invalidate the gacha records
    if (changes > 0) {
      console.debug('Invalidating prettized gacha records cache...')
      invalidatePrettizedGachaRecordsQuery(selectedAccount.business, selectedAccount.uid, i18n.constants.gacha)
      invalidateFirstGachaRecordQuery(selectedAccount.business, selectedAccount.uid)
    }
  }, [i18n, notifier, onSuccess, produce, selectedAccount, state])

  return (
    <div className={styles.root}>
      <Field
        size="large"
        label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.File.Label']} />}
        validationState={state.fileError ? 'error' : 'none'}
        validationMessage={state.fileError}
        required
      >
        <div className={styles.fileContainer}>
          <Input
            className={styles.fileInput}
            contentBefore={<AttachRegular />}
            name="file"
            placeholder={i18n.t('Pages.Gacha.LegacyView.DataConvert.ImportForm.File.Placeholder')}
            appearance="filled-darker"
            autoComplete="off"
            value={state.file ?? ''}
            disabled={state.busy}
            readOnly
          />
          <Locale
            component={Button}
            size="large"
            onClick={onSelectFile}
            disabled={state.busy}
            mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.File.SelectBtn']}
          />
        </div>
      </Field>
      <Field
        size="large"
        label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.Format.Label']} />}
        validationState="success"
        validationMessage={<Locale
          mapping={[`Pages.Gacha.LegacyView.DataConvert.Format.${state.format}.Info`]}
        />}
        required
      >
        <div className={styles.formatContainer}>
          {supportedFormats.map((value) => (
            <Button
              key={value}
              value={value}
              className={styles.formatButton}
              aria-checked={value === state.format}
              onClick={onFormatChange}
              disabled={state.busy}
              appearance="outline"
            >
              <Locale mapping={[`Pages.Gacha.LegacyView.DataConvert.Format.${value}.Text`]} />
            </Button>
          ))}
        </div>
      </Field>
      {!firstGachaRecord && (state.format === 'Uigf' || state.format === 'LegacyUigf') && (
        <Field
          size="large"
          label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.UigfLocale.Label']} />}
          validationState="none"
          validationMessageIcon={<InfoFilled className={styles.localeIcon} />}
          validationMessage={<Locale
            mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.UigfLocale.Info']}
          />}
        >
          <Select
            appearance="filled-darker"
            value={state.formatUigfLocale}
            onChange={(_, data) => produce((draft) => {
              draft.formatUigfLocale = data.value as SupportedGachaLocale
            })}
            disabled={state.busy}
          >
            {GachaLocales.map((locale) => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field
        size="large"
        label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.SaveOnConflict.Label']} />}
      >
        <RadioGroup
          layout="horizontal"
          value={state.saveOnConflict}
          onChange={onSaveOnConflictChange}
          disabled={state.busy}
        >
          {SaveOnConflicts.map((value) => (
            <Radio
              key={value}
              value={value}
              label={<Locale
                mapping={[`Pages.Gacha.LegacyView.DataConvert.ImportForm.SaveOnConflict.Values.${value}`]}
              />}
            />
          ))}
        </RadioGroup>
      </Field>
      <div className={styles.bottom}>
        <div className={styles.progress}>
          {state.busy && (
            <ProgressBar thickness="large" value={state.progress} max={1} />
          )}
        </div>
        <div className={styles.actions}>
          <Locale
            component={Button}
            onClick={onCancel}
            mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.CancelBtn']}
            disabled={state.busy}
          />
          <Locale
            component={Button}
            appearance="primary"
            onClick={onSubmit}
            mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.SubmitBtn']}
            disabled={state.busy || !state.file}
          />
        </div>
      </div>
    </div>
  )
}
