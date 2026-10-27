import { useCallback } from 'react'
import { Checkbox, CheckboxProps, Image, makeStyles, tokens } from '@fluentui/react-components'
import { StackOffRegular } from '@fluentui/react-icons'
import { AccountBusiness, AccountBusinessKeys, KeyofAccountBusiness, isAccountBusiness } from '@/api/Account'
import BusinessImages from '@/assets/images/BusinessImages'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useBusinessVisibilityMutation, useBusinessVisibilitySuspenseQuery } from '@/routes/Root/hooks/useBusinessVisibility'
import Section from '@/routes/Settings/components/Sections/Section'

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} 0`,
  },
  image: {
    width: '3rem',
    height: '3rem',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
  },
})

export default function BusinessVisibility () {
  const styles = useStyles()
  const { t } = useI18n({ ns: KnownI18nNs.SettingsPage, scope: 'General.BusinessVisibility' })
  const { data: visibility } = useBusinessVisibilitySuspenseQuery()
  const { mutateAsync } = useBusinessVisibilityMutation()
  const handleChange = useCallback<NonNullable<CheckboxProps['onChange']>>((evt, data) => {
    const keyof = evt.currentTarget.value as KeyofAccountBusiness | undefined
    if (keyof && isAccountBusiness(AccountBusiness[keyof])) {
      mutateAsync({
        [AccountBusiness[keyof]]: data.checked as boolean,
      })
    }
  }, [mutateAsync])

  return (
    <Section.CollapsibleItem
      icon={<StackOffRegular />}
      title={t('Title')}
      subtitle={t('Subtitle')}
      defaultVisible
    >
      <div className={styles.wrapper}>
        {AccountBusinessKeys.map((keyof) => (
          <Checkbox
            key={keyof}
            value={keyof}
            onChange={handleChange}
            checked={visibility[AccountBusiness[keyof]] ?? true}
            label={<Image className={styles.image} src={BusinessImages[keyof].Icon} />}
            size="large"
          />
        ))}
      </div>
    </Section.CollapsibleItem>
  )
}
