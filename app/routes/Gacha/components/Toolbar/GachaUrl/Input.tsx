import { Field, Input, makeStyles, tokens } from '@fluentui/react-components'
import { KnownI18nNs, useI18n } from '@/i18n'
import { useBusiness } from '@/routes/Gacha/contexts/Business/hooks'
import { useGachaUrl } from './hooks'

const useStyles = makeStyles({
  root: {
    maxWidth: '12rem',
    paddingRight: tokens.spacingHorizontalXS,
  },
  inputExpired: {
    color: tokens.colorPaletteRedForeground1,
  },
  inputValid: {
    color: tokens.colorBrandForeground2,
  },
})

export default function GachaUrlInput () {
  const styles = useStyles()
  const { t } = useI18n({ ns: KnownI18nNs.GachaPage })
  const business = useBusiness()
  const url = useGachaUrl()

  return (
    <Field validationState={url.hasExpired ? 'error' : undefined}>
      <Input
        className={styles.root}
        input={{ className: url.hasExpired ? styles.inputExpired : styles.inputValid }}
        value={url.value || ''}
        placeholder={t('Toolbar.GachaUrl.Placeholder', { keyof: business.keyof })}
        appearance="outline"
        size="large"
        readOnly
      />
    </Field>
  )
}
