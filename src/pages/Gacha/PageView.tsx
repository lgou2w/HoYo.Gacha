import React from 'react'
import { makeStyles } from '@fluentui/react-components'
import GachaLegacyView from './LegacyView'

const useStyles = makeStyles({
  root: {
    height: '100%',
  },
})

export default function GachaPageView () {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <GachaLegacyView />
    </div>
  )
}
