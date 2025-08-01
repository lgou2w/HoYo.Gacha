import React, { Suspense, createRef, useCallback, useMemo } from 'react'
import { Button, Link, Spinner, Table, TableBody, TableCell, TableRow, makeStyles, tableCellClassNames, tableRowClassNames } from '@fluentui/react-components'
import { InfoRegular } from '@fluentui/react-icons'
import { Await } from '@tanstack/react-router'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import isPromise from 'is-promise'
import { gitInfo, osInfo, tauriVersion, webview2Version } from '@/api/commands/core'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { stringifyOsInfoVersion } from '@/interfaces/Os'
import SettingsOptionsCollapse from '@/pages/Settings/Options/OptionsCollapse'

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
      '&[data-clipboard-key="true"]': {
        maxWidth: '12rem',
      },
    },
  },
})

export default function SettingsOptionsAboutSpecification () {
  const styles = useStyles()
  const i18n = useI18n()
  const data: Record<string, string | Promise<string | { value: string, link: string }>> = useMemo(() => {
    return {
      OperatingSystem: osInfo().then((value) => value.edition || value.os_type),
      SystemVersion: osInfo().then((value) => {
        return stringifyOsInfoVersion(value.version) + ' ' + (value.architecture || value.bitness)
      }),
      Webview2: webview2Version(),
      Tauri: tauriVersion(),
      GitCommit: gitInfo().then((info) => info.commitHash),
      AppVersion: gitInfo().then((info) => {
        return {
          value: `v${__APP_VERSION__}-git-${info.commitHash.substring(0, 7)} (${i18n.dayjs(info.commitDate).fromNow()})`,
          link: `${__APP_REPOSITORY__}/commit/${info.commitHash}`,
        }
      }),
    }
  }, [i18n])

  const tableRef = createRef<HTMLDivElement>()
  const handleCopy = useCallback(() => {
    if (!tableRef.current) return

    let text = ''
    for (const entry of tableRef.current.querySelectorAll('[data-clipboard-entry]')) {
      const key = entry.querySelector('[data-clipboard-key]')
      const val = entry.querySelector('[data-clipboard-val]')
      if (key && val) {
        text += `${key.textContent}\t${val.textContent}\n`
      }
    }

    writeText(text)
  }, [tableRef])

  return (
    <SettingsOptionsCollapse
      icon={<InfoRegular />}
      title={<Locale mapping={['Pages.Settings.Options.About.Specification.Title']} />}
      initialVisible
      actionExt={(
        <Locale
          component={Button}
          onClick={handleCopy}
          mapping={['Pages.Settings.Options.About.Specification.CopyBtn']}
        />
      )}
    >
      <Table ref={tableRef} className={styles.table} size="small" noNativeElements>
        <TableBody>
          {Object.entries(data).map(([key, val]) => (
            <TableRow key={key} data-clipboard-entry>
              <Locale
                component={TableCell}
                mapping={[`Pages.Settings.Options.About.Specification.${key}`]}
                data-clipboard-key
              />
              <TableCell data-clipboard-val>
                {isPromise(val)
                  ? (
                      <Suspense fallback={<Spinner />}>
                        <Await promise={val}>
                          {(data) => typeof data === 'string'
                            ? data
                            : <Link href={data.link} target="_blank" rel="noreferre">{data.value}</Link>}
                        </Await>
                      </Suspense>
                    )
                  : val
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SettingsOptionsCollapse>
  )
}
