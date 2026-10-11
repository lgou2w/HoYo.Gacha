import { Menu, MenuDivider, MenuGroup, MenuGroupHeader, MenuItem, MenuList, MenuPopover, MenuTrigger, SplitButton } from '@fluentui/react-components'
import { ArrowClockwiseRegular, ArrowSyncRegular, LinkEditRegular } from '@fluentui/react-icons'
import { KnownI18nNs, useI18n } from '@/i18n'
import { SaveToDatabase } from '@/routes/Gacha/api/business'
import { useAction } from './hooks'
import { DataAction } from './types'

export default function GachaUrlAction () {
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage, scope: 'Toolbar.GachaUrl.Action' })
  const { update, disabled } = useAction()

  return (
    <>
      <Menu
        positioning={{ align: 'end', offset: { crossAxis: 0, mainAxis: 8 } }}
      >
        <MenuTrigger disableButtonEnhancement>
          {(triggerProps) => (
            <SplitButton
              icon={<ArrowClockwiseRegular />}
              menuButton={triggerProps}
              primaryActionButton={{
                onClick: update,
                ...{ [DataAction]: SaveToDatabase.Yes },
              }}
              disabled={disabled}
              appearance="primary"
              size="large"
            >
              {t('Button')}
            </SplitButton>
          )}
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuGroupHeader>
              {t('More.Label')}
            </MenuGroupHeader>
            <MenuGroup>
              <MenuItem
                icon={<ArrowSyncRegular />}
                onClick={update}
                {...{ [DataAction]: SaveToDatabase.FullUpdate }}
              >
                {t('More.FullUpdate')}
              </MenuItem>
            </MenuGroup>
            <MenuDivider />
            <MenuGroup>
              <MenuItem
                icon={<LinkEditRegular />}
              >
                {t('More.ManualInput')}
              </MenuItem>
            </MenuGroup>
          </MenuList>
        </MenuPopover>
      </Menu>
    </>
  )
}
