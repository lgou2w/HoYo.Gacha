import { KeyofBusinesses } from '@/interfaces/Business'

export type Assets = Record<string, string | undefined>
export type BizImages = Record<KeyofBusinesses, Record<string, Assets | undefined>>

const BizImages = Object.entries<string>(import.meta.glob('@/assets/images/(GenshinImpact|MiliastraWonderland|HonkaiStarRail|ZenlessZoneZero)/**/*.avif', {
  eager: true,
  import: 'default',
  query: '?url',
})).reduce((acc, [src, href]) => {
  const exec = /\/assets\/images\/(GenshinImpact|MiliastraWonderland|HonkaiStarRail|ZenlessZoneZero)\/(.+)\/(.+)\.avif/.exec(src)

  if (exec) {
    const [, keyofBusinesses, category, identity] = exec
    const key = keyofBusinesses as KeyofBusinesses
    const categoryAssets = (acc[key] || (acc[key] = {}))
    const assets = (categoryAssets[category] || (categoryAssets[category] = {}))
    assets[identity] = href
  }

  return acc
}, {} as BizImages)

if (import.meta.env.DEV) {
  console.debug('BizImages:', BizImages)
}

export default Object.freeze(BizImages)
