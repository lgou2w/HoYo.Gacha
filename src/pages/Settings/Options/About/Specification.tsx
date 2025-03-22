import React, { Suspense, createRef, useCallback, useMemo } from 'react'
import { Table, TableBody, TableCell, TableRow, makeStyles, tableCellClassNames, tableRowClassNames } from '@fluentui/react-components'
import { InfoRegular } from '@fluentui/react-icons'
import { Await } from '@tanstack/react-router'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import isPromise from 'is-promise'
import { osInfo, tauriVersion, webview2Version } from '@/api/commands/core'
import Locale from '@/components/Locale'
import Button from '@/components/UI/Button'
import Spinner from '@/components/UI/Spinner'
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
    },
  },
})

export default function SettingsOptionsAboutSpecification () {
  const styles = useStyles()
  const data: Record<string, string | Promise<string>> = useMemo(() => {
    return {
      OperatingSystem: osInfo().then((value) => value.edition || value.os_type),
      SystemVersion: osInfo().then((value) => stringifyOsInfoVersion(value.version)),
      SystemType: osInfo().then((value) => value.architecture || value.bitness),
      Webview2: webview2Version(),
      Tauri: tauriVersion(),
    }
  }, [])

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
                          {(data) => data}
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
