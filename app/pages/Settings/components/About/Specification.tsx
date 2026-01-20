import { createRef, useMemo } from 'react'
import { Link, Spinner, Table, TableBody, TableCell, TableRow, makeStyles, tableCellClassNames, tableRowClassNames } from '@fluentui/react-components'
import { InfoRegular } from '@fluentui/react-icons'
import { Await } from '@tanstack/react-router'
import AppCommands, { Environment } from '@/api/commands/app'
import CopyButton from '@/components/CopyButton'
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
          {Object.entries(Dataset).map(([key, value]) => (
            <TableRow key={key} data-entry>
              <TableCell className={styles.tableCellLabel} data-entry-key>
                {t(`About.Specification.${key}`)}
              </TableCell>
              <TableCell data-entry-val>
                <Await promise={value} fallback={<Spinner />}>
                  {(value) => typeof value === 'string'
                    ? value
                    : (
                        <Link href={value.link} target="_blank" rel="noreferre">
                          {`${value.version}-git-${value.shortHash} (${dayjs(value.date).fromNow()})`}
                        </Link>
                      )}
                </Await>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCollapseItem>
  )
})

function env<R> (selector: (env: Environment) => R): Promise<R> {
  return AppCommands
    .environment()
    .then((env) => selector(env))
}

interface AppVersion {
  version: string
  shortHash: string
  date: string
  link: string
}

const Dataset: Record<string, Promise<string | AppVersion>> = {
  OperatingSystem: env((e) => e.os.edition),
  SystemVersion: env((e) => e.windows?.version + ' ' + e.os.architecture),
  Webview2: env((e) => e.webviewVersion),
  Tauri: env((e) => e.tauriVersion),
  GitCommit: env((e) => e.git.commitHash),
  AppVersion: env((e) => {
    return {
      version: e.app.version,
      shortHash: e.git.commitHash.substring(0, 7),
      date: e.git.commitDate,
      link: `${e.git.remoteUrl}/commit/${e.git.commitHash}`,
    }
  }),
}
