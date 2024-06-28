import { useContext } from 'react'
import { ToasterContext } from './Context'

export default function useToaster () {
  const value = useContext(ToasterContext)
  if (!value) {
    throw new Error('useToaster must be used within a ToasterContext.Provider')
  } else {
    return value
  }
}
