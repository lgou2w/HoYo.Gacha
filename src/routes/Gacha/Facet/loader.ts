import { AccountFacet, AccountFacets } from '@/api/interfaces/account'
import { DeferredData, QueryLoaderFunction, defer } from '@/api/store'

const loader: QueryLoaderFunction<DeferredData<{
  facet: AccountFacet
  records: Promise<string[]>
}>> = () => (args) => {
  const keyOfAccountFacets = args.params.facet as keyof typeof AccountFacets | undefined
  const facet = keyOfAccountFacets && AccountFacets[keyOfAccountFacets]

  // HACK: Can't use `!facet` because zero is also the correct value.
  if (facet === null || typeof facet === 'undefined') {
    throw new Error(`Unknown account facets key: ${keyOfAccountFacets}`)
  }

  // load gacha records

  // etc..

  return defer({
    facet,
    records: new Promise((resolve) => {
      setTimeout(() => {
        resolve(['a', 'b'])
      }, 0)
    })
  })
}

export default loader
