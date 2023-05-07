import React from 'react'
import { QueryClient, QueryKey, UseQueryOptions, useQuery } from '@tanstack/react-query'
import { AccountFacet, Account } from '@/interfaces/account'
import Storage from '@/storage'
import Typography from '@mui/material/Typography'

// TODO: test
const genshinAccountsQuery: UseQueryOptions<Account[]> & { queryKey: QueryKey } = {
  queryKey: ['genshin-accounts'],
  queryFn: async () => Storage.findAccounts(AccountFacet.Genshin),
  staleTime: Infinity,
  cacheTime: Infinity,
  refetchOnWindowFocus: false
}

export const loader = (queryClient: QueryClient) => async () => {
  return (
    queryClient.getQueryData(genshinAccountsQuery.queryKey) ??
    (await queryClient.fetchQuery(genshinAccountsQuery))
  )
}

export default function Genshin () {
  const { data } = useQuery(genshinAccountsQuery)

  return (
    <React.Fragment>
      <Typography variant="h5">Genshin Impact</Typography>
      <Typography>{JSON.stringify(data)}</Typography>
    </React.Fragment>
  )
}
