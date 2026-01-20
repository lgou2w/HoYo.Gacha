import { useEffect, useState } from 'react'

export default function useAutoUpdate (delay: number) {
  const [n, forceUpdate] = useState(0)

  useEffect(() => {
    const timerId = setInterval(() => {
      forceUpdate((prevN) => prevN + 1)
    }, delay)

    return () => {
      clearInterval(timerId)
    }
  }, [delay])

  return n
}
