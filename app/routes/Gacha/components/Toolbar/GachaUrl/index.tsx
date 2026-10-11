import { LinkRegular } from '@fluentui/react-icons'
import ToolbarContainer from '@/routes/Gacha/components/Toolbar/Container'
import GachaUrlAction from './Action'
import GachaUrlInput from './Input'
import GachaUrlLabel from './Label'
import GachaUrlProvider from './provider'

export default function GachaUrl () {
  return (
    <GachaUrlProvider>
      <ToolbarContainer
        icon={LinkRegular}
        label={<GachaUrlLabel />}
      >
        <GachaUrlInput />
        <GachaUrlAction />
      </ToolbarContainer>
    </GachaUrlProvider>
  )
}
