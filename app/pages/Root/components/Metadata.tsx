import { Button, ToastTrigger } from '@fluentui/react-components'
import { QueryKey, useQuery } from '@tanstack/react-query'
import MetadataCommands, { MetadataUpdateKind } from '@/api/commands/metadata'
import errorTrans from '@/api/errorTrans'
import { WithTransKnownNs, useI18n } from '@/i18n'
import useNotifier, { DefaultNotifierTimeouts } from '@/pages/Root/hooks/useNotifier'
import queryClient from '@/queryClient'
import Notifier from './Notifier'

const MetadataToasterId = 'metadata-toaster'

export default function Metadata () {
  useMetadataUpdater()
  return (
    <Notifier
      toasterId={MetadataToasterId}
      position="bottom"
    />
  )
}

const MetadataUpdaterQueryKey: QueryKey = ['Metadata', 'Updater']
const ErrorTimeout = 60 * 1000 // 1 Minute

// HACK: Users typically don't leave the program running for extended periods.
// This option ensures that metadata is checked periodically and notifications are pushed out.
const RefetchInterval = 10 * 60 * 1000 // 10 Minutes
const MaxAttempts = 3

function useMetadataUpdater () {
  const notifier = useNotifier(MetadataToasterId)
  const { t } = useI18n(WithTransKnownNs.RootPage)

  useQuery({
    gcTime: Infinity,
    staleTime: Infinity,
    networkMode: 'online',
    refetchOnReconnect: true,
    refetchInterval: RefetchInterval,
    queryKey: MetadataUpdaterQueryKey,
    queryFn: () => {
      if (!window.navigator.onLine) {
        // Offline
        return
      }

      const promise = MetadataCommands.update({
        maxAttempts: MaxAttempts,
      })

      return notifier.promise(promise, {
        loading: {
          title: t('Metadata.Loading'),
        },
        success (result) {
          if (!result || result === MetadataUpdateKind.Updating) {
            // HACK: Feature disabled or Normally you won't encounter `Updating`.
            return
          }

          const hash = typeof result == 'object'
            ? result[MetadataUpdateKind.Success]
            : undefined

          return {
            title: t('Metadata.Success.Title'),
            body: t('Metadata.Success.Body', {
              hash,
              context: hash
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
              <ToastTrigger>
                <Button
                  size="small"
                  appearance="outline"
                  onClick={() => {
                    queryClient.fetchQuery({
                      queryKey: MetadataUpdaterQueryKey,
                    })
                  }}
                >
                  {t('Metadata.Retry')}
                </Button>
              </ToastTrigger>
            ),
            timeout: ErrorTimeout,
            dismissible: true,
          }
        },
      })
    },
  })
}
