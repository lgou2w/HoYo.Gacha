import { useCallback, useMemo } from 'react'
import { Link, Table, TableBody, TableCell, TableRow, makeStyles, tableCellClassNames, tableRowClassNames } from '@fluentui/react-components'
import { InfoRegular } from '@fluentui/react-icons'
import CopyButton from '@/components/CopyButton'
import { useEnvironment } from '@/contexts/Environment/hooks'
import { deviceSpec } from '@/contexts/Environment/types'
import { KnownI18nNs, useI18n } from '@/i18n'
import Section from '@/routes/Settings/components/Sections/Section'

const useStyles = makeStyles({
  table: {
    [`& .${tableRowClassNames.root}`]: {
      borderBottom: 'none',
      ':hover': {
        backgroundColor: 'transparent',
      },
    },
    [`& .${tableCellClassNames.root}`]: {
      padding: 0,
    },
  },
  tableCellLabel: {
    maxWidth: '12rem',
  },
})

type DeviceSpec = ReturnType<typeof deviceSpec>
type SpecValue = DeviceSpec[keyof DeviceSpec]

export default function Specification () {
  const styles = useStyles()
  const { t, dayjs } = useI18n({ ns: KnownI18nNs.SettingsPage, scope: 'About.Specification' })
  const environment = useEnvironment()
  const dataset = useMemo(
    () => Object.entries(deviceSpec(environment)) as [string, SpecValue][],
    [environment],
  )

  const copyContent = useCallback(() => {
    let text = ''
    for (const [key, value] of dataset) {
      const rendered = typeof value === 'string'
        ? value
        : value != null && `${value.text} (${dayjs(value.date).fromNow()})`

      if (rendered) {
        text += `${t(key)}\t${rendered}\n`
      }
    }

    return text
  }, [dayjs, dataset, t])

  return (
    <Section.CollapsibleItem
      icon={<InfoRegular />}
      title={t('Title')}
      defaultVisible
      action={(
        <CopyButton content={copyContent} size="small">
          {(copied) => t(copied ? 'Copied' : 'Copy')}
        </CopyButton>
      )}
    >
      <Table className={styles.table} size="small" noNativeElements>
        <TableBody>
          {dataset.map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className={styles.tableCellLabel}>
                {t(key)}
              </TableCell>
              <TableCell>
                {typeof value === 'string'
                  ? value
                  : value != null && (
                    <Link href={value.href} target="_blank" rel="noreferrer">
                      {`${value.text} (${dayjs(value.date).fromNow()})`}
                    </Link>
                  )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section.CollapsibleItem>
  )
}
