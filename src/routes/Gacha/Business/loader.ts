import { Businesses, KeyofBusinesses } from '@/api/interfaces/account'
import { DeferredData, QueryLoaderFunction, defer } from '@/api/store'
import { BusinessContextState } from '@/components/BusinessProvider/Context'

const loader: QueryLoaderFunction<DeferredData<BusinessContextState>> = () => (args) => {
  const keyofBusinesses = args.params.business as KeyofBusinesses | undefined
  const business = keyofBusinesses && Businesses[keyofBusinesses]

  // HACK: Can't use `!business` because zero is also the correct value.
  if (!keyofBusinesses || business === null || typeof business === 'undefined') {
    throw new Error(`Unknown businesses key: ${keyofBusinesses}`)
  }

  return defer({
    keyofBusinesses,
    business
  })
}

export default loader
