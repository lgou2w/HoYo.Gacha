import React from 'react'
import { Button, Subtitle2, Tooltip, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { PeopleAddRegular, PeopleListRegular } from '@fluentui/react-icons'
import useAccountFacet from '@/components/AccountFacet/useAccountFacet'
import AddOrEditDialog from '@/components/Accounts/FacetView/AddOrEditDialog'
import Locale from '@/components/Core/Locale'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: tokens.spacingVerticalS,
    boxShadow: tokens.shadow4,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM)
  },
  icon: {
    display: 'inline-flex',
    fontSize: '1.25rem',
    width: '1.25rem',
    height: '1.25rem'
  },
  header: {
    display: 'inline-flex',
    flexGrow: 1
  },
  action: {
    display: 'inline-flex',
    '> .fui-Button': {
      minWidth: '2rem',
      maxWidth: '2rem',
      ...shorthands.padding('0.3125rem'),
      '> .fui-Button__icon': {
        fontSize: '1.25rem',
        width: '1.25rem',
        height: '1.25rem'
      }
    }
  }
})

export default function AccountsFacetViewToolbar () {
  const { keyOfFacets } = useAccountFacet()
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <div className={classes.icon}>
        <PeopleListRegular />
      </div>
      <Locale
        className={classes.header}
        component={Subtitle2}
        as="h6"
        mapping={[
          'components.accounts.facetView.toolbar.title',
          { facet: keyOfFacets }
        ]}
      />
      <div className={classes.action}>
        <AddOrEditDialog
          edit={null}
          trigger={(
            <Tooltip
              relationship="label"
              positioning="before"
              content={<Locale mapping={['components.accounts.facetView.toolbar.addAccountBtn']} />}
              withArrow
            >
              <Button appearance="subtle" icon={<PeopleAddRegular />} />
            </Tooltip>
          )}
        />
      </div>
    </div>
  )
}
