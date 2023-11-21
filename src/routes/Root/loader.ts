import { getAccountsQueryDataOrFetch } from '@/api/queries/account'
import { DeferredData, QueryLoaderFunction, defer } from '@/api/store'

// TODO:
//   load assets
//   load all accounts

const loader: QueryLoaderFunction<DeferredData<{
  tasks: Promise<unknown[]>
}>> = () => () => {
  return defer({
    tasks: Promise.all([
      getAccountsQueryDataOrFetch()
    ])
  })
}

export default loader
