import React from 'react'
import { Caption1, makeStyles } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    height: '100%',
  },
})

export default function Home () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Caption1>Home TODO</Caption1>
    </div>
  )
}
