import React from 'react'
import { GenshinGachaRecord } from '@/interfaces/gacha'
import { GachaFacet, findGachaRecords } from '@/storage/gacha'

export default function App () {
  const [records, setRecords] = React.useState<GenshinGachaRecord[]>()

  const findRecords = async () => {
    findGachaRecords(GachaFacet.Genshin, 'uid', undefined, 10)
      .then((records) => { setRecords(records) })
      .catch((err) => { console.error(err) })
  }

  return (
    <div>
      <h1>App</h1>
      <button onClick={findRecords}>Find Records</button>
      {records && <p>{JSON.stringify(records)}</p>}
    </div>
  )
}
