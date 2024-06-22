import { AccountBusinesses } from '@/api/interfaces/account'
import { DeferredData, QueryLoaderFunction, defer } from '@/api/store'
import { AccountBusinessContextState } from '@/components/AccountBusiness/Context'

const loader: QueryLoaderFunction<DeferredData<AccountBusinessContextState>> = () => (args) => {
  const keyOfBusinesses = args.params.business as keyof typeof AccountBusinesses | undefined
  const business = keyOfBusinesses && AccountBusinesses[keyOfBusinesses]

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
