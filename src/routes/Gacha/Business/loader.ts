import { Businesses } from '@/api/interfaces/account'
import { DeferredData, QueryLoaderFunction, defer } from '@/api/store'
import { BusinessContextState } from '@/components/BusinessProvider/Context'

const loader: QueryLoaderFunction<DeferredData<BusinessContextState>> = () => (args) => {
  const keyOfBusinesses = args.params.business as keyof typeof Businesses | undefined
  const business = keyOfBusinesses && Businesses[keyOfBusinesses]

  // HACK: Can't use `!business` because zero is also the correct value.
  if (!keyOfBusinesses || business === null || typeof business === 'undefined') {
    throw new Error(`Unknown account businesses key: ${keyOfBusinesses}`)
  }

  return defer({
    keyOfBusinesses,
    business
  })
}

export default loader
