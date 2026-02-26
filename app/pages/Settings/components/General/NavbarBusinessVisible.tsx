import { useCallback } from 'react'
import { Checkbox, CheckboxProps, Image, makeStyles, tokens } from '@fluentui/react-components'
import { StackOffRegular } from '@fluentui/react-icons'
import { AccountBusiness, AccountBusinessKeys, KeyofAccountBusiness } from '@/api/schemas/Account'
import BusinessImages from '@/assets/images/BusinessImages'
import { WithTrans, withTrans } from '@/i18n'
import { useNavbarBusinessVisibleMutation, useNavbarBusinessVisibleSuspenseQuery } from '@/pages/Root/queries/navbar'
import SectionCollapseItem from '@/pages/Settings/components/SectionCollapseItem'

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

export default withTrans.SettingsPage(function NavbarBusinessVisible ({ t }: WithTrans) {
  const styles = useStyles()
  const { data } = useNavbarBusinessVisibleSuspenseQuery()
  const mutation = useNavbarBusinessVisibleMutation()
  const handleChange = useCallback<Required<CheckboxProps>['onChange']>((evt, data) => {
    const keyof = evt.currentTarget.value as KeyofAccountBusiness | undefined
    if (keyof) {
      mutation.mutateAsync({
        [AccountBusiness[keyof]]: data.checked as boolean,
      })
    }
  }, [mutation])

  return (
    <SectionCollapseItem
      icon={<StackOffRegular />}
      title={t('General.NavbarBusinessVisible.Title')}
      subtitle={t('General.NavbarBusinessVisible.Subtitle')}
      defaultVisible
    >
      <div className={styles.wrapper}>
        {AccountBusinessKeys.map((keyof) => (
          <Checkbox
            key={keyof}
            value={keyof}
            onChange={handleChange}
            // The pending status can be ignored because the cost is very low.
            // Otherwise, for the user, the disabled status would cause the checkbox
            // to flicker (in a disabled state), affecting the user experience.
            // disabled={mutation.isPending}
            checked={data[AccountBusiness[keyof]] ?? true}
            label={(
              <Image
                className={styles.image}
                src={BusinessImages[keyof].Material!.Icon!}
              />
            )}
            size="large"
          />
        ))}
      </div>
    </SectionCollapseItem>
  )
})
