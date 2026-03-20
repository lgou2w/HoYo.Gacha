import { KeyofAccountBusiness } from '@/api/schemas/Account'

type Assets = Record<string, string | undefined>
type BusinessImages = Record<KeyofAccountBusiness, Record<string, Assets | undefined>>

// Vite 7 -> 8 : https://github.com/vitejs/vite/issues/21839#issuecomment-4054117822
// Issue : https://github.com/vitejs/rolldown-vite/issues/365
const BusinessImages = Object.entries<string>(import.meta.glob('@/assets/images/{GenshinImpact,MiliastraWonderland,HonkaiStarRail,ZenlessZoneZero}/**/*.avif', {
  eager: true,
  import: 'default',
  query: '?url',
})).reduce((acc, [src, href]) => {
  const exec = /\/assets\/images\/(GenshinImpact|MiliastraWonderland|HonkaiStarRail|ZenlessZoneZero)\/(.+)\/(.+)\.avif/.exec(src)

  if (exec) {
    const [, key, category, identity] = exec
    const categoryAssets = (acc[key as KeyofAccountBusiness] || (acc[key as KeyofAccountBusiness] = {}))
    const assets = (categoryAssets[category] || (categoryAssets[category] = {}))
    assets[identity] = href
  }

  return acc
}, {} as BusinessImages)

if (import.meta.env.DEV) {
  console.debug('BusinessImages:', BusinessImages)
}

Object.freeze(BusinessImages)

export default BusinessImages
