import React, { ComponentProps, useCallback } from 'react'
import { Checkbox, Image, makeStyles, tokens } from '@fluentui/react-components'
import { StackOffRegular } from '@fluentui/react-icons'
import { useNavbarBusinessVisibleSuspenseQueryData, useUpdateNavbarBusinessVisibleMutation } from '@/api/queries/business'
import BizImages from '@/components/BizImages'
import Locale from '@/components/Locale'
import { Business, Businesses, ReversedBusinesses } from '@/interfaces/Business'
import SettingsOptionsCollapse from '@/pages/Settings/Options/OptionsCollapse'

export default function SettingsOptionsGeneralNavbarBusinessVisible () {
  return (
    <SettingsOptionsCollapse
      icon={<StackOffRegular />}
      title={<Locale mapping={['Pages.Settings.Options.General.NavbarBusinessVisible.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.General.NavbarBusinessVisible.Subtitle']} />}
      initialVisible
    >
      <SettingsOptionsGeneralNavbarBusinessVisibleControl />
    </SettingsOptionsCollapse>
  )
}

const useControlStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} 0`,
  },
  checkbox: {},
  icon: {
    width: '3rem',
    height: '3rem',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
  },
})

function SettingsOptionsGeneralNavbarBusinessVisibleControl () {
  const styles = useControlStyles()
  const visible = useNavbarBusinessVisibleSuspenseQueryData()

  const updateNavbarBusinessVisibleMutation = useUpdateNavbarBusinessVisibleMutation()
  const handleChange = useCallback<Required<ComponentProps<typeof Checkbox>>['onChange']>((evt, data) => {
    evt.preventDefault()
    const business = evt.currentTarget.getAttribute('data-business') as Business | null
    if (business !== null && typeof business !== 'undefined') {
      updateNavbarBusinessVisibleMutation.mutateAsync({ [business]: data.checked })
    }
  }, [updateNavbarBusinessVisibleMutation])

  return (
    <div className={styles.root}>
      {Object.values(Businesses).map((business) => (
        <Checkbox
          key={business}
          className={styles.checkbox}
          data-business={business}
          checked={visible[business] ?? true}
          onChange={handleChange}
          disabled={updateNavbarBusinessVisibleMutation.isPending}
          label={<Image className={styles.icon} src={BizImages[ReversedBusinesses[business]].Material!.Icon!} />}
          size="large"
        />
      ))}
    </div>
  )
}
