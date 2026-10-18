import { KeyofAccountBusiness } from '@/api/Account'

type BusinessImages = Record<KeyofAccountBusiness, Record<string, string | undefined>>

// Vite 7 -> 8 : https://github.com/vitejs/vite/issues/21839#issuecomment-4054117822
// Issue : https://github.com/vitejs/rolldown-vite/issues/365
const BusinessImages = Object.entries<string>(import.meta.glob('@/assets/images/{GenshinImpact,MiliastraWonderland,HonkaiStarRail,ZenlessZoneZero}/*.avif', {
  eager: true,
  import: 'default',
  query: '?url',
})).reduce((acc, [src, href]) => {
  const exec = /\/assets\/images\/(GenshinImpact|MiliastraWonderland|HonkaiStarRail|ZenlessZoneZero)\/(.+)\.avif/.exec(src)

  if (exec) {
    const [, key, identity] = exec
    const assets = (acc[key as KeyofAccountBusiness] || (acc[key as KeyofAccountBusiness] = {}))
    assets[identity] = href
  }

  return acc
}, {} as BusinessImages)

if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
  console.debug('BusinessImages:', BusinessImages)
}

Object.freeze(BusinessImages)

export default BusinessImages
