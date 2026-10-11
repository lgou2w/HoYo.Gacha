import { MouseEventHandler, use, useCallback, useRef, useState } from 'react'
import { SaveToDatabase } from '@/routes/Gacha/api/business'
import { useAccount } from '@/routes/Gacha/contexts/Account/hooks'
import { useGachaStats } from '@/routes/Gacha/contexts/Stats/hooks'
import { DataAction, GachaUrlContext } from './types'

export function useGachaUrl () {
  const state = use(GachaUrlContext)
  if (!state) {
    throw new Error('useGachaUrl must be used within an GachaUrlProvider')
  } else {
    return state
  }
}

export function useAction () {
  const { selected } = useAccount()
  const stats = useGachaStats()

  const [isBusy, setBusy] = useState(false)
  const busyRef = useRef(isBusy)

  const disabled = !selected || !stats || isBusy

  const update = useCallback<MouseEventHandler>(async (evt) => {
    const saveToDatabase = evt.currentTarget
      .getAttribute(DataAction) as SaveToDatabase | null

    if (!saveToDatabase) {
      return
    }

    console.debug('Preparing to update gacha url with:', saveToDatabase)
  }, [])

  return {
    update,
    isBusy,
    disabled,
  }
}
