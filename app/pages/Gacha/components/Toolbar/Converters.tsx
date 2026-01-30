import { ComponentRef, useRef } from 'react'
import { Button, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowDownloadRegular, ArrowUploadRegular } from '@fluentui/react-icons'
import { WithTrans, withTrans } from '@/i18n'
import ConvertersExporter from '@/pages/Gacha/components/Converters/Exporter'
import ConvertersImporter from '@/pages/Gacha/components/Converters/Importer'
import { usePrettizedRecords } from '@/pages/Gacha/contexts/PrettizedRecords'
import ToolbarContainer from './Container'

const useStyles = makeStyles({
  wrapper: {
    display: 'inline-flex',
    justifyContent: 'space-between',
    flex: '1 0 auto',
    columnGap: tokens.spacingHorizontalXS,
  },
})

export default withTrans.GachaPage(function Converters ({ t }: WithTrans) {
  const styles = useStyles()
  const { business, selected, data } = usePrettizedRecords()

  const importerRef = useRef<ComponentRef<typeof ConvertersImporter>>(null)
  const exporterRef = useRef<ComponentRef<typeof ConvertersExporter>>(null)

  const importable = !!selected
  const exportable = !!selected && data && data.total > 0

  return (
    <ToolbarContainer
      label={t('Toolbar.Converters.Label')}
      labelCenter
    >
      <div className={styles.wrapper}>
        <Button
          onClick={() => importerRef.current?.open()}
          disabled={!importable}
          icon={<ArrowDownloadRegular />}
          appearance="subtle"
          shape="circular"
          size="large"
        />
        <Button
          onClick={() => exporterRef.current?.open()}
          disabled={!exportable}
          icon={<ArrowUploadRegular />}
          appearance="subtle"
          shape="circular"
          size="large"
        />
      </div>
      {selected && (
        <>
          <ConvertersImporter
            ref={importerRef}
            business={business.value}
            uid={selected.uid}
          />
          <ConvertersExporter
            ref={exporterRef}
            business={business.value}
            uid={selected.uid}
          />
        </>
      )}
    </ToolbarContainer>
  )
})
