import React, { Fragment } from 'react'
import { Button } from '@fluentui/react-components'
import { event } from '@tauri-apps/api'
import { importGachaRecords } from '@/api/commands/business'

export default function Home () {
  // TODO: Experimental
  const onClick = async () => {
    try {
      const progressChannel = 'business_import_gacha_records_progress'
      const unlisten = await event.listen<number>(progressChannel, (event) => {
        console.debug('Progress:', event.payload)
      })

      try {
        const result = await importGachaRecords({
          input: 'X:/UIGF_20240912_184321.json',
          importer: {
            LegacyUigf: {
              expectedLocale: 'zh-cn',
              expectedUid: 100000001
            }
          },
          progressChannel
        })
        console.debug('Command result:', result)
      } finally {
        unlisten()
      }
    } catch (e) {
      console.error(e)
    }
  }
  //

  return (
    <Fragment>
      <label>Experimental:</label>
      <Button onClick={onClick} appearance="outline">Test</Button>
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <br /><br /><br /><br /><br />
      <label>Bottom</label>
    </Fragment>
  )
}
