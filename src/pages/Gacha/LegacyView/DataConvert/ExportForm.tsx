import React, { MouseEventHandler, useCallback, useMemo } from 'react'
import { Button, Field, Input, Radio, RadioGroup, Switch, makeStyles, tokens } from '@fluentui/react-components'
import { AttachRegular } from '@fluentui/react-icons'
import { useImmer } from 'use-immer'
import { ExportGachaRecordsArgs, exportGachaRecords } from '@/api/commands/business'
import { pickFolder } from '@/api/commands/core'
import errorTranslation from '@/api/errorTranslation'
import { useSelectedAccountSuspenseQueryData } from '@/api/queries/accounts'
import { useFirstGachaRecordSuspenseQueryData } from '@/api/queries/business'
import Locale from '@/components/Locale'
import useBusinessContext from '@/hooks/useBusinessContext'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import { Business, Businesses } from '@/interfaces/Business'
import { KeyofUnion } from '@/interfaces/declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  folderContainer: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
  },
  folderInput: {
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
  actions: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
  },
})

interface Props {
  onCancel?: () => void
  onSuccess?: () => void
}

type SupportedFormat = KeyofUnion<ExportGachaRecordsArgs['exporter']>
const SupportedFormats: Record<Business, SupportedFormat[]> = {
  [Businesses.GenshinImpact]: ['Uigf', 'LegacyUigf'],
  [Businesses.HonkaiStarRail]: ['Uigf', 'Srgf'],
  [Businesses.ZenlessZoneZero]: ['Uigf'],
}

type LegacyUigfVersion = Extract<
  ExportGachaRecordsArgs['exporter'],
  { LegacyUigf: unknown }
>['LegacyUigf']['uigfVersion']

const LegacyUigfVersions: LegacyUigfVersion[] = ['v2.2', 'v2.3', 'v2.4', 'v3.0']

export default function GachaLegacyViewDataConvertExportForm (props: Props) {
  const styles = useStyles()
  const { onCancel, onSuccess } = props

  const { business, keyofBusinesses } = useBusinessContext()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const firstGachaRecord = useFirstGachaRecordSuspenseQueryData(business, selectedAccount?.uid)
  const supportedFormats = useMemo(() => SupportedFormats[business], [business])
  const i18n = useI18n()
  const notifier = useNotifier()

  const [{
    folder, folderError,
    format, formatLegacyUigfVersion, formatUigfMinimized,
    busy,
  }, produce] = useImmer({
    folder: null as string | null,
    folderError: null as string | null,
    format: supportedFormats[0],
    formatLegacyUigfVersion: LegacyUigfVersions[0] as LegacyUigfVersion,
    formatUigfMinimized: false,
    busy: false,
  })

  const onSelectFolder = useCallback(async () => {
    const folder = await pickFolder({})

    folder && produce((draft) => {
      draft.folder = folder
    })
  }, [produce])

  const onFormatChange = useCallback<MouseEventHandler<HTMLButtonElement>>((evt) => {
    const newFormat = evt.currentTarget.value as SupportedFormat
    produce((draft) => {
      draft.format = newFormat
    })
  }, [produce])

  const onSubmit = useCallback(async () => {
    if (!selectedAccount || !firstGachaRecord || !folder) {
      return
    }

    const accountUid = selectedAccount.uid
    const accountLocale = firstGachaRecord.lang
    const exportTime = new Date()

    let exporter: ExportGachaRecordsArgs['exporter']
    switch (format) {
      case 'Uigf':
        exporter = {
          [format]: {
            businesses: [business],
            accounts: { [accountUid]: accountLocale },
            exportTime,
            minimized: formatUigfMinimized,
          },
        }
        break
      case 'LegacyUigf':
        exporter = {
          [format]: {
            uigfVersion: formatLegacyUigfVersion,
            accountLocale,
            accountUid,
            exportTime,
          },
        }
        break
      case 'Srgf':
        exporter = {
          [format]: {
            srgfVersion: 'v1.0',
            accountLocale,
            accountUid,
            exportTime,
          },
        }
        break
    }

    produce((draft) => {
      draft.folderError = null
      draft.busy = true
    })

    const filename = [
      __APP_NAME__,
      format,
      accountUid,
      i18n.dayjs(exportTime).format('YYYYMMDD_HHmmss'),
    ].join('_')

    const output = folder + __PATH_SEP__ + filename

    let outputFile: string
    try {
      outputFile = await exportGachaRecords({
        output,
        exporter,
      })
    } catch (error) {
      produce((draft) => {
        draft.folderError = errorTranslation(i18n, error)
        draft.busy = false
      })

      throw error
    }

    produce((draft) => {
      draft.busy = false
    })

    onSuccess?.()

    notifier.success(i18n.t('Pages.Gacha.LegacyView.DataConvert.ExportForm.Success.Title'), {
      body: i18n.t('Pages.Gacha.LegacyView.DataConvert.ExportForm.Success.Body', {
        output: outputFile,
      }),
    })
  }, [business, firstGachaRecord, folder, format, formatLegacyUigfVersion, formatUigfMinimized, i18n, notifier, onSuccess, produce, selectedAccount])

  if (!firstGachaRecord) {
    // TODO: Tell the user that there are no records and cannot be exported.
    //   It is best to prohibit opening this component in the parent component.
    return null
  }

  return (
    <div className={styles.root}>
      <Field
        size="large"
        label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.Folder.Label']} />}
        validationState={folderError ? 'error' : 'none'}
        validationMessage={folderError}
        required
      >
        <div className={styles.folderContainer}>
          <Input
            className={styles.folderInput}
            contentBefore={<AttachRegular />}
            name="file"
            placeholder={i18n.t('Pages.Gacha.LegacyView.DataConvert.ExportForm.Folder.Placeholder')}
            appearance="filled-darker"
            autoComplete="off"
            value={folder ?? ''}
            disabled={busy}
            readOnly
          />
          <Locale
            component={Button}
            size="large"
            onClick={onSelectFolder}
            disabled={busy}
            mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.Folder.SelectBtn']}
          />
        </div>
      </Field>
      <Field
        size="large"
        label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.Format.Label']} />}
        validationState="success"
        validationMessage={<Locale
          mapping={[`Pages.Gacha.LegacyView.DataConvert.Format.${format}.Info`]}
        />}
        required
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
          label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.LegacyUigfVersion.Label']} />}
        >
          <RadioGroup
            layout="horizontal"
            value={formatLegacyUigfVersion}
            onChange={(_, data) => produce((draft) => {
              draft.formatLegacyUigfVersion = data.value as LegacyUigfVersion
            })}
            disabled={busy}
          >
            {LegacyUigfVersions.map((value) => (
              <Radio
                key={value}
                value={value}
                label={value}
              />
            ))}
          </RadioGroup>
        </Field>
      )}
      {format === 'Uigf' && (
        <Field
          size="large"
          label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.UigfMinimized.Label']} />}
          validationMessage={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.UigfMinimized.Info']} />}
          validationState="warning"
        >
          <Switch
            labelPosition="after"
            label={<Locale mapping={
              ['Pages.Gacha.LegacyView.DataConvert.ExportForm.UigfMinimized.State',
                { context: String(formatUigfMinimized) },
              ]} />}
            checked={formatUigfMinimized}
            onChange={(_, data) => produce((draft) => {
              draft.formatUigfMinimized = data.checked
            })}
            disabled={busy}
          />
        </Field>
      )}
      <div className={styles.actions}>
        <Locale
          component={Button}
          onClick={onCancel}
          mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.CancelBtn']}
          disabled={busy}
        />
        <Locale
          component={Button}
          appearance="primary"
          onClick={onSubmit}
          mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.SubmitBtn']}
          disabled={busy || !folder}
        />
      </div>
    </div>
  )
}
