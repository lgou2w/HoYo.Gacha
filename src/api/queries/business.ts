import { queryOptions } from '@tanstack/react-query'
import { PrettyGachaRecordsError, findAndPrettyGachaRecords } from '@/api/commands/business'
import { SqlxDatabaseError, SqlxError } from '@/api/commands/database'
import { Account } from '@/interfaces/Account'
import { Business, KeyofBusinesses, ReversedBusinesses } from '@/interfaces/Business'
import { PrettizedGachaRecords } from '@/interfaces/GachaRecord'

type PrettizedGachaRecordsKey = [KeyofBusinesses, Account['uid'] | null, 'PrettizedGachaRecords']
function prettizedGachaRecordsKey (business: Business, uid: Account['uid'] | null): PrettizedGachaRecordsKey {
  return [ReversedBusinesses[business], uid, 'PrettizedGachaRecords']
}

export function prettizedGachaRecordsQueryOptions<T extends Business> (
  business: T,
  uid: Account['uid'] | null,
) {
  return queryOptions<
    PrettizedGachaRecords<T> | null,
    SqlxError | SqlxDatabaseError | PrettyGachaRecordsError | Error,
    PrettizedGachaRecords<T> | null,
    PrettizedGachaRecordsKey
  >({
    staleTime: Infinity,
    queryKey: prettizedGachaRecordsKey(business, uid),
    queryFn: () => uid
      ? findAndPrettyGachaRecords<T>({
        business,
        uid,
      })
      : null,
  })
}
