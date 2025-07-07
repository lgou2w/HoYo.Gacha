import { makeStaticStyles, tokens } from '@fluentui/react-components'
import { ScrollbarWidth } from '@/components/Layout/declares'
import { DEFAULT_BASE_FONT_SIZE, VAR_BASE_FONT_SIZE } from '@/interfaces/Theme'

const useGlobalStyles = makeStaticStyles({
  ':root': {
    [VAR_BASE_FONT_SIZE]: DEFAULT_BASE_FONT_SIZE,
    fontSize: `var(${VAR_BASE_FONT_SIZE})`,
  },
  '*': {
    boxSizing: 'border-box',
  },
  'html, body': {
    margin: 0,
    padding: 0,
    overflow: 'hidden',
  },
  'blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre': {
    margin: 0,
  },
  img: {
    '-webkit-user-drag': 'none',
  },
  '::-webkit-scrollbar': {
    background: tokens.colorTransparentBackground,
    width: ScrollbarWidth,
  },
  '::-webkit-scrollbar-thumb': {
    background: tokens.colorNeutralForeground4,
    backgroundClip: 'padding-box',
    borderRadius: '6px',
    border: `4px solid ${tokens.colorTransparentBackground}`,
  },
  '::-webkit-scrollbar-track': {
    background: tokens.colorTransparentBackground,
  },
})

export default useGlobalStyles
