import { useCallback, useRef } from 'react'
import { Body1, Button, Dialog, DialogActions, DialogBody, DialogContent, DialogProps, DialogSurface, DialogTitle, DialogTrigger, DialogTriggerProps, Field, ProgressBar, makeStyles, tokens } from '@fluentui/react-components'
import { Channel } from '@tauri-apps/api/core'
import { exit } from '@tauri-apps/plugin-process'
import { useImmer } from 'use-immer'
import UpdaterCommands, { UpdaterKind, UpdaterResult } from '@/api/commands/updater'
import errorTrans from '@/api/errorTrans'
import { WithTrans, withTrans } from '@/i18n'
import useAppNotifier from '@/pages/Root/hooks/useAppNotifier'

const useStyles = makeStyles({
  surface: {
    maxWidth: '30rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
  errorSubtitle: {
    color: tokens.colorStatusDangerForeground1,
  },
  errorActions: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalM,
  },
})

const MaxAttempts = 3

export default withTrans.RootPage(function Updater (
  { t, trigger }: WithTrans & { trigger: DialogTriggerProps['children'] },
) {
  const styles = useStyles()
  const [{
    open,
    progress,
    lastError,
    success,
  }, produceState] = useImmer({
    open: false,
    progress: undefined as number | undefined,
    lastError: null as unknown | null,
    success: false,
  })

  const notifier = useAppNotifier()

  const updating = useRef(false)
  const update = useCallback(async () => {
    if (updating.current) {
      return
    }

    updating.current = true
    produceState((draft) => {
      draft.lastError = null
      draft.progress = undefined
    })

    const progressChannel = new Channel<number>((progress) => {
      produceState((draft) => {
        draft.progress = progress
      })
    })

    let result: UpdaterResult
    try {
      result = await UpdaterCommands.update({
        progressChannel,
        maxAttempts: MaxAttempts,
      })
    } catch (error) {
      updating.current = false
      produceState((draft) => {
        draft.lastError = error
      })
      throw error
    }

    console.debug('Update result:', result)
    const shouldClose = !result || result !== UpdaterKind.Success

    updating.current = false
    produceState((draft) => {
      draft.lastError = null
      draft.success = result === UpdaterKind.Success
      if (shouldClose) {
        draft.open = false
      }
    })

    // Up-to-date
    if (shouldClose && result === UpdaterKind.UpToDate) {
      notifier.success(t('Updater.UpToDate'))
    }
  }, [notifier, produceState, t])

  const handleOpenChange = useCallback<Required<DialogProps>['onOpenChange']>((_, data) => {
    produceState((draft) => {
      draft.open = data.open
    })

    // Trigger open
    if (data.open) {
      update()
    }
  }, [produceState, update])

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      modalType="alert"
    >
      <DialogTrigger disableButtonEnhancement>
        {trigger}
      </DialogTrigger>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>
            {t('Updater.Title')}
          </DialogTitle>
          <DialogContent className={styles.content}>
            <Body1
              className={lastError ? styles.errorSubtitle : undefined}
              as="p"
              block
            >
              {success
                ? t('Updater.Subtitle.Success')
                : lastError
                  ? t('Updater.Subtitle.Error', { message: errorTrans(t, lastError) })
                  : t('Updater.Subtitle.Progress')}
            </Body1>
            {!success && (
              <Field
                validationState="none"
                validationMessage={t('Updater.Progress', {
                  context: progress === undefined && 'indeterminate',
                  value: progress && (progress * 100).toFixed(2),
                })}
              >
                <ProgressBar
                  thickness="large"
                  value={progress}
                  max={1}
                />
              </Field>
            )}
          </DialogContent>
          <DialogActions>
            {success
              ? (
                  <Button onClick={() => exit(1)} appearance="primary">
                    {t('Updater.Confirm')}
                  </Button>
                )
              : lastError && (
                <div className={styles.errorActions}>
                  <DialogTrigger action="close">
                    <Button>
                      {t('Updater.Cancel')}
                    </Button>
                  </DialogTrigger>
                  <Button onClick={update}>
                    {t('Updater.Retry')}
                  </Button>
                </div>
              )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
})
