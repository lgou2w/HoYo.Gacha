import { createRef, useMemo } from 'react'
import { Link, Table, TableBody, TableCell, TableRow, makeStyles, tableCellClassNames, tableRowClassNames } from '@fluentui/react-components'
import { InfoRegular } from '@fluentui/react-icons'
import { deviceSpec } from '@/api/commands/app'
import CopyButton from '@/components/CopyButton'
import { useEnvironment } from '@/contexts/Environment'
import { WithTrans, i18nDayjs, withTrans } from '@/i18n'
import SectionCollapseItem from '@/pages/Settings/components/SectionCollapseItem'

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
      minHeight: '2.125rem',
    },
  },
  tableCellLabel: {
    maxWidth: '12rem',
  },
})

export default withTrans.SettingsPage(function Specification ({ i18n, t }: WithTrans) {
  const styles = useStyles()
  const environment = useEnvironment()
  const dataset = useMemo(() => deviceSpec(environment), [environment])
  const dayjs = i18nDayjs(i18n.language)

  const tableRef = createRef<HTMLDivElement>()
  const copyContent = useMemo(() => async function () {
    if (!tableRef.current) return ''

    let text = ''
    for (const entry of tableRef.current.querySelectorAll('[data-entry]')) {
      const key = entry.querySelector('[data-entry-key]')
      const val = entry.querySelector('[data-entry-val]')
      if (key && val) {
        text += `${key.textContent}\t${val.textContent}\n`
      }
    }

    return text
  }, [tableRef])

  return (
    <SectionCollapseItem
      icon={<InfoRegular />}
      title={t('About.Specification.Title')}
      defaultVisible
      action={(
        <CopyButton content={copyContent} size="small">
          {(copied) => t(`About.Specification.${copied ? 'Copied' : 'Copy'}`)}
        </CopyButton>
      )}
    >
      <Table ref={tableRef} className={styles.table} size="small" noNativeElements>
        <TableBody>
          {Object.entries(dataset).map(([key, value]) => (
            <TableRow key={key} data-entry>
              <TableCell className={styles.tableCellLabel} data-entry-key>
                {t(`About.Specification.${key}`)}
              </TableCell>
              <TableCell data-entry-val>
                {typeof value === 'string'
                  ? value
                  : (
                      <Link href={value.link} target="_blank" rel="noreferre">
                        {`${value.text} (${dayjs(value.date).fromNow()})`}
                      </Link>
                    )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCollapseItem>
  )
})
