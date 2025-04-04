import React, { ComponentProps, MouseEventHandler, useCallback, useMemo } from 'react'
import { ProgressBar, makeStyles, tokens } from '@fluentui/react-components'
import { AttachRegular, InfoFilled } from '@fluentui/react-icons'
import { listen } from '@tauri-apps/api/event'
import { useImmer } from 'use-immer'
import { ImportGachaRecordsArgs, importGachaRecords } from '@/api/commands/business'
import { pickFile } from '@/api/commands/core'
import { extractErrorMessage } from '@/api/error'
import { useSelectedAccountSuspenseQueryData } from '@/api/queries/accounts'
import { invalidatePrettizedGachaRecordsQuery } from '@/api/queries/business'
import Locale from '@/components/Locale'
import Button from '@/components/UI/Button'
import Field from '@/components/UI/Field'
import Input from '@/components/UI/Input'
import Radio from '@/components/UI/Radio'
import RadioGroup from '@/components/UI/RadioGroup'
import Select from '@/components/UI/Select'
import useBusinessContext from '@/hooks/useBusinessContext'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import { GachaLocales, SupportedGachaLocale, preferredGachaLocale } from '@/i18n/locales'
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

export default function GachaLegacyViewDataConvertImportForm (props: Props) {
  const styles = useStyles()
  const { onCancel, onSuccess } = props

  const { business, keyofBusinesses } = useBusinessContext()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const supportedFormats = useMemo(() => SupportedFormats[business], [business])
  const i18n = useI18n()
  const notifier = useNotifier()

  const [{ file, fileError, format, formatLegacyUigfLocale, saveOnConflict, progress, busy }, produce] = useImmer({
    file: null as string | null,
    fileError: null as string | null,
    format: supportedFormats[0],
    formatLegacyUigfLocale: preferredGachaLocale(i18n.language),
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
    if (!selectedAccount || !file) {
      return
    }

    let importer: ImportGachaRecordsArgs['importer']
    switch (format) {
      case 'Uigf':
        importer = {
          [format]: {
            accounts: [selectedAccount.uid],
            businesses: [selectedAccount.business],
          },
        }
        break
      case 'LegacyUigf':
        importer = {
          [format]: {
            expectedUid: selectedAccount.uid,
            expectedLocale: formatLegacyUigfLocale,
          },
        }
        break
      case 'Srgf':
        importer = {
          [format]: { expectedUid: selectedAccount.uid },
        }
        break
      default:
        return
    }

    produce((draft) => {
      draft.fileError = null
      draft.busy = true
    })

    const progressChannel = 'DataConvert_ProgressChannel_Import'

    let changes: number
    try {
      const unlisten = await listen<number>(progressChannel, (event) => {
        produce((draft) => {
          draft.progress = event.payload
        })
      })

      try {
        changes = await importGachaRecords({
          input: file,
          importer,
          saveOnConflict,
          progressChannel,
        })
      } finally {
        unlisten()
      }
    } catch (error) {
      produce((draft) => {
        draft.fileError = extractErrorMessage(error)
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

    if (changes > 0) {
      // HACK: If the change is greater than 0, invalidate the gacha records
      invalidatePrettizedGachaRecordsQuery(selectedAccount.business, selectedAccount.uid)
    }
  }, [file, format, formatLegacyUigfLocale, i18n, notifier, onSuccess, produce, saveOnConflict, selectedAccount])

  return (
    <div className={styles.root}>
      <Field
        size="large"
        label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.File.Label']} />}
        validationState={fileError ? 'error' : 'none'}
        validationMessage={fileError}
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
            value={file ?? ''}
            disabled={busy}
            readOnly
          />
          <Locale
            component={Button}
            size="large"
            onClick={onSelectFile}
            disabled={busy}
            mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.File.SelectBtn']}
          />
        </div>
      </Field>
      <Field
        size="large"
        label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.Format.Label']} />}
        validationState="success"
        validationMessage={<Locale
          mapping={[`Pages.Gacha.LegacyView.DataConvert.Format.${format}.Info`]}
        />}
      >
        <div className={styles.formatContainer}>
          {supportedFormats.map((value) => (
            <Button
              key={value}
              value={value}
              className={styles.formatButton}
              aria-checked={value === format}
              onClick={onFormatChange}
              disabled={busy}
              appearance="outline"
            >
              <Locale mapping={[`Pages.Gacha.LegacyView.DataConvert.Format.${value}.Text`]} />
            </Button>
          ))}
        </div>
      </Field>
      {format === 'LegacyUigf' && (
        <Field
          size="large"
          label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.Locale.Label']} />}
          validationState="none"
          validationMessageIcon={<InfoFilled className={styles.localeIcon} />}
          validationMessage={<Locale
            mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.Locale.Info']}
          />}
        >
          <Select
            appearance="filled-darker"
            value={formatLegacyUigfLocale}
            onChange={(_, data) => produce((draft) => {
              draft.formatLegacyUigfLocale = data.value as SupportedGachaLocale
            })}
            disabled={busy}
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
          value={saveOnConflict}
          onChange={onSaveOnConflictChange}
          disabled={busy}
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
          {busy && (
            <ProgressBar thickness="large" value={progress} max={1} />
          )}
        </div>
        <div className={styles.actions}>
          <Locale
            component={Button}
            onClick={onCancel}
            mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.CancelBtn']}
            disabled={busy}
          />
          <Locale
            component={Button}
            appearance="primary"
            onClick={onSubmit}
            mapping={['Pages.Gacha.LegacyView.DataConvert.ImportForm.SubmitBtn']}
            disabled={busy || !file}
          />
        </div>
      </div>
    </div>
  )
}
