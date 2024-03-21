import { AccountFacets } from '@/api/interfaces/account'
import { DeferredData, QueryLoaderFunction, defer } from '@/api/store'
import { AccountFacetContextState } from '@/components/AccountFacet/Context'

const loader: QueryLoaderFunction<DeferredData<AccountFacetContextState>> = () => (args) => {
  const keyOfFacets = args.params.facet as keyof typeof AccountFacets | undefined
  const facet = keyOfFacets && AccountFacets[keyOfFacets]

  // HACK: Can't use `!facet` because zero is also the correct value.
  if (!keyOfFacets || facet === null || typeof facet === 'undefined') {
    throw new Error(`Unknown account facets key: ${keyOfFacets}`)
  }

  return defer({
    keyOfFacets,
    facet
  })
}

export default loader
