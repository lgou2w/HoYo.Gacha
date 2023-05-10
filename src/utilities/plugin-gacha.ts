import { AccountFacet } from '@/interfaces/account'
import invoke from '@/utilities/invoke'

export async function findGameDataDirectories (facet: AccountFacet): Promise<string[]> {
  return invoke('plugin:gacha|find_game_data_directories', { facet })
}

const PluginGacha = Object.freeze({
  findGameDataDirectories
})

export default PluginGacha
