import { PropsWithChildren } from 'react'
import { Button } from '@fluentui/react-components'
import { QueryKey, useQuery } from '@tanstack/react-query'
import MetadataCommands, { MetadataUpdateKind, MetadataUpdateResult } from '@/api/commands/metadata'
import errorTrans from '@/api/errorTrans'
import { WithTransKnownNs, useI18n } from '@/i18n'
import Notifier from '@/pages/Root/components/Notifier'
import useNotifier, { DefaultNotifierTimeouts } from '@/pages/Root/hooks/useNotifier'
import { MetadataContext, MetadataState } from './context'

const MetadataToasterId = 'metadata-toaster'

export default function MetadataProvider (props: PropsWithChildren) {
  const state = useMetadataState()
  return (
    <MetadataContext value={state}>
      <Notifier
        toasterId={MetadataToasterId}
        position="bottom"
      />
      {props.children}
    </MetadataContext>
  )
}

const MetadataUpdaterQueryKey: QueryKey = ['Metadata', 'Updater']
const ErrorTimeout = 60 * 1000 // 1 Minute

// HACK: Users typically don't leave the program running for extended periods.
// This option ensures that metadata is checked periodically and notifications are pushed out.
const RefetchInterval = 10 * 60 * 1000 // 10 Minutes
const MaxAttempts = 3

function useMetadataState (): MetadataState {
  const { t } = useI18n(WithTransKnownNs.RootPage)
  const notifier = useNotifier(MetadataToasterId)
  return useQuery<
    MetadataUpdateResult | 'offline'
  >({
    gcTime: Infinity,
    staleTime: Infinity,
    networkMode: 'online',
    refetchOnReconnect: true,
    refetchInterval: RefetchInterval,
    queryKey: MetadataUpdaterQueryKey,
    queryFn: (context) => {
      if (!window.navigator.onLine) {
        return 'offline'
      }

      const promise = MetadataCommands.update({
        maxAttempts: MaxAttempts,
      })

      notifier.dismissAll()
      return notifier.promise(promise, {
        loading: {
          title: t('Metadata.Loading'),
        },
        success (result) {
          if (!result || result === MetadataUpdateKind.Updating) {
            // HACK: Feature disabled or Normally you won't encounter `Updating`.
            return
          }

          const successHash = typeof result == 'object'
            && MetadataUpdateKind.Success in result
            ? result[MetadataUpdateKind.Success]
            : undefined

          return {
            title: t('Metadata.Success.Title'),
            body: t('Metadata.Success.Body', {
              hash: successHash,
              context: successHash
                ? MetadataUpdateKind.Success
                : MetadataUpdateKind.UpToDate,
            }),
            timeout: DefaultNotifierTimeouts.success * 2,
            dismissible: true,
          }
        },
        error (error) {
          return {
            title: t('Metadata.Error'),
            body: errorTrans(t, error),
            footer: (
              <Button
                size="small"
                appearance="outline"
                onClick={() => {
                  context.client.fetchQuery({
                    queryKey: MetadataUpdaterQueryKey,
                  })
                }}
              >
                {t('Metadata.Retry')}
              </Button>
            ),
            timeout: ErrorTimeout,
            dismissible: true,
          }
        },
      })
    },
  })
}
