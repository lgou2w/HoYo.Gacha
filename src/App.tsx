import React, { useState, useEffect } from 'react'
import { findGameDataDir, findRecentGachaUrl } from './utilities/commands'

export default function App () {
  const [gameDataDir, setGameDataDir] = useState<string>()
  const [gachaUrl, setGachaUrl] = useState<Awaited<ReturnType<typeof findRecentGachaUrl>> | string>()

  useEffect(() => {
    globalThis.setTimeout(() => {
      findGameDataDir()
        .then(setGameDataDir)
        .catch(setGameDataDir)
      findRecentGachaUrl()
        .then(setGachaUrl)
        .catch(setGachaUrl)
    }, 1000)
  }, [])

  return (
    <div className="app m-4">
      <h1 className="text-xl text-red-300">Genshin Gacha</h1>
      <p className="text-lg text-black">原神</p>
      {gameDataDir && <p>游戏数据目录：{gameDataDir}</p>}
      {gachaUrl && <p>祈愿链接：{JSON.stringify(gachaUrl)}</p>}
    </div>
  )
}
