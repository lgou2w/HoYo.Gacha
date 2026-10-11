import { useCallback, useMemo } from 'react'
import { Menu, MenuButton, MenuItemCheckbox, MenuList, MenuPopover, MenuProps, MenuTrigger, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { EyeRegular } from '@fluentui/react-icons'
import { KnownI18nNs, useI18n } from '@/i18n'
import BannerCategoryName from '@/routes/Gacha/components/Banner/CategoryName'
import { useBannerSortable } from '@/routes/Gacha/contexts/BannerSortable/hooks'

const CheckedName = 'banner'

const useStyles = makeStyles({
  menuButton: {
    flexShrink: 0,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    '&[aria-expanded=true]': {
      color: tokens.colorBrandForeground2Hover,
      boxShadow: tokens.shadow2,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
})

export default function BannerVisibilityMenu () {
  const styles = useStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const { order, isHidden, setHidden } = useBannerSortable()
  const visible = useMemo(
    () => order.filter((id) => !isHidden(id)),
    [isHidden, order],
  )

  const handleChange = useCallback<Required<MenuProps>['onCheckedValueChange']>((_, data) => {
    const nextVisible = new Set(data.checkedItems)
    const nextHidden = order.filter((id) => !nextVisible.has(id))
    setHidden(nextHidden)
  }, [order, setHidden])

  return (
    <Menu
      checkedValues={{ [CheckedName]: visible }}
      onCheckedValueChange={handleChange}
      positioning={{ align: 'end', offset: { crossAxis: 0, mainAxis: 8 } }}
    >
      <MenuTrigger disableButtonEnhancement>
        <MenuButton className={styles.menuButton} icon={<EyeRegular />} appearance="outline" size="small">
          {t('Clientarea.BannerVisibilityMenu.Button')}
        </MenuButton>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {order.map((id) => (
            <MenuItemCheckbox key={id} name={CheckedName} value={id}>
              <BannerCategoryName category={id} />
            </MenuItemCheckbox>
          ))}
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
