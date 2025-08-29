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

type UigfVersion = Extract<
  ExportGachaRecordsArgs['exporter'],
  { Uigf: unknown }
>['Uigf']['uigfVersion']

const UigfVersions: { LegacyUigf: LegacyUigfVersion[], Uigf: UigfVersion[], Srgf: [] } = {
  LegacyUigf: ['v2.0', 'v2.1', 'v2.2', 'v2.3', 'v2.4', 'v3.0'],
  Uigf: ['v4.0', 'v4.1'],
  Srgf: [],
}

export default function GachaLegacyViewDataConvertExportForm (props: Props) {
  const styles = useStyles()
  const { onCancel, onSuccess } = props

  const { business, keyofBusinesses } = useBusinessContext()
  const selectedAccount = useSelectedAccountSuspenseQueryData(keyofBusinesses)
  const firstGachaRecord = useFirstGachaRecordSuspenseQueryData(business, selectedAccount?.uid)
  const supportedFormats = useMemo(() => SupportedFormats[business], [business])
  const i18n = useI18n()
  const notifier = useNotifier()

  const [state, produce] = useImmer({
    folder: null as string | null,
    folderError: null as string | null,
    format: supportedFormats[0],
    formatUigfVersion: UigfVersions[supportedFormats[0]][0],
    formatUigfMinimized: false,
    formatPretty: false,
    busy: false,
  })

  const handleSelectFolder = useCallback(async () => {
    const folder = await pickFolder({})

    folder && produce((draft) => {
      draft.folder = folder
    })
  }, [produce])

  const handleFormatChange = useCallback<MouseEventHandler<HTMLButtonElement>>((evt) => {
    const newFormat = evt.currentTarget.value as SupportedFormat
    produce((draft) => {
      draft.format = newFormat
    })
  }, [produce])

  const handleSubmit = useCallback(async () => {
    if (!selectedAccount || !firstGachaRecord || !state.folder) {
      return
    }

    const accountUid = selectedAccount.uid
    const accountLocale = firstGachaRecord.lang
    const exportTime = new Date()

    let exporter: ExportGachaRecordsArgs['exporter']
    switch (state.format) {
      case 'Uigf':
        exporter = {
          [state.format]: {
            uigfVersion: state.formatUigfVersion as UigfVersion,
            businesses: [business],
            accounts: { [accountUid]: accountLocale },
            exportTime,
            minimized: state.formatUigfMinimized,
            pretty: state.formatPretty,
          },
        }
        break
      case 'LegacyUigf':
        exporter = {
          [state.format]: {
            uigfVersion: state.formatUigfVersion as LegacyUigfVersion,
            accountLocale,
            accountUid,
            exportTime,
            pretty: state.formatPretty,
          },
        }
        break
      case 'Srgf':
        exporter = {
          [state.format]: {
            srgfVersion: 'v1.0',
            accountLocale,
            accountUid,
            exportTime,
            pretty: state.formatPretty,
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
      state.format,
      accountUid,
      i18n.dayjs(exportTime).format('YYYYMMDD_HHmmss'),
    ].join('_')

    const output = state.folder + __PATH_SEP__ + filename

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
  }, [business, firstGachaRecord, i18n, notifier, onSuccess, produce, selectedAccount, state])

  // See: ../Toolbar/Convert.tsx
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
        validationState={state.folderError ? 'error' : 'none'}
        validationMessage={state.folderError}
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
            value={state.folder ?? ''}
            disabled={state.busy}
            readOnly
          />
          <Locale
            component={Button}
            size="large"
            onClick={handleSelectFolder}
            disabled={state.busy}
            mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.Folder.SelectBtn']}
          />
        </div>
      </Field>
      <Field
        size="large"
        label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.Format.Label']} />}
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
              onClick={handleFormatChange}
              disabled={state.busy}
              appearance="outline"
            >
              <Locale mapping={[`Pages.Gacha.LegacyView.DataConvert.Format.${value}.Text`]} />
            </Button>
          ))}
        </div>
      </Field>
      {(state.format === 'LegacyUigf' || state.format === 'Uigf') && (
        <Field
          size="large"
          label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.UigfVersion.Label']} />}
        >
          <RadioGroup
            layout="horizontal"
            value={state.formatUigfVersion}
            onChange={(_, data) => produce((draft) => {
              draft.formatUigfVersion = data.value as LegacyUigfVersion | UigfVersion
            })}
            disabled={state.busy}
          >
            {UigfVersions[state.format].map((value) => (
              <Radio
                key={value}
                value={value}
                label={value}
              />
            ))}
          </RadioGroup>
        </Field>
      )}
      {state.format === 'Uigf' && (
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
                { context: String(state.formatUigfMinimized) },
              ]} />}
            checked={state.formatUigfMinimized}
            onChange={(_, data) => produce((draft) => {
              draft.formatUigfMinimized = data.checked
            })}
            disabled={state.busy}
          />
        </Field>
      )}
      {/* Pretty supports: LegacyUigf, Uigf, Srgf */}
      <Field
        size="large"
        label={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.Pretty.Label']} />}
        validationMessage={<Locale mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.Pretty.Info']} />}
        validationState="none"
      >
        <Switch
          labelPosition="after"
          label={<Locale mapping={
            ['Pages.Gacha.LegacyView.DataConvert.ExportForm.Pretty.State',
              { context: String(state.formatPretty) },
            ]} />}
          checked={state.formatPretty}
          onChange={(_, data) => produce((draft) => {
            draft.formatPretty = data.checked
          })}
          disabled={state.busy}
        />
      </Field>
      <div className={styles.actions}>
        <Locale
          component={Button}
          onClick={onCancel}
          mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.CancelBtn']}
          disabled={state.busy}
        />
        <Locale
          component={Button}
          appearance="primary"
          onClick={handleSubmit}
          mapping={['Pages.Gacha.LegacyView.DataConvert.ExportForm.SubmitBtn']}
          disabled={state.busy || !state.folder}
        />
      </div>
    </div>
  )
}
