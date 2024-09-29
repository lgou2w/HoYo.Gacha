import React, { ComponentProps } from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import GachaLegacyViewToolbarAccount from './Account'
import GachaLegacyViewToolbarConvert from './Convert'
import GachaLegacyViewToolbarTabs from './Tabs'
import GachaLegacyViewToolbarUrl from './Url'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalL,
    alignItems: 'center'
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'space-between'
  }
})

type GachaLegacyViewToolbarTabsProps = ComponentProps<typeof GachaLegacyViewToolbarTabs>

type Props = Omit<React.JSX.IntrinsicElements['div'], 'children'> & {
  tab: GachaLegacyViewToolbarTabsProps['value']
  onTabChange?: GachaLegacyViewToolbarTabsProps['onChange']
}

export default function GachaLegacyViewToolbar (props: Props) {
  const { className, tab, onTabChange, ...rest } = props
  const classes = useStyles()
  return (
    <div className={mergeClasses(classes.root, className)} {...rest}>
      <GachaLegacyViewToolbarAccount />
      <GachaLegacyViewToolbarUrl />
      <div className={classes.actions}>
        <div aria-label="placeholder" aria-hidden />
        <GachaLegacyViewToolbarTabs value={tab} onChange={onTabChange} />
        <GachaLegacyViewToolbarConvert />
      </div>
    </div>
  )
}
