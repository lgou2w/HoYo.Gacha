import React, { Fragment, MouseEventHandler, useCallback, useEffect } from 'react'
import { Body1, Button, Caption1, Dialog, DialogSurface, Field, ProgressBar, makeStyles, tokens } from '@fluentui/react-components'
import { listen } from '@tauri-apps/api/event'
import { exit } from '@tauri-apps/plugin-process'
import { useImmer } from 'use-immer'
import { updaterUpdate } from '@/api/commands/core'
import errorTranslation from '@/api/errorTranslation'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import Locale from './Locale'

const useStyles = makeStyles({
  surface: {
    maxWidth: '20rem',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
})

const ProgressChannel = 'updater'
const ProgressMax = 100

let completed = false

export default function Updater () {
  const styles = useStyles()
  const [state, produce] = useImmer({
    progress: undefined as number | undefined,
    busy: false,
    success: false,
  })

  const notifier = useNotifier()
  const i18n = useI18n()
  useEffect(() => {
    if (completed) {
      return
    }

    completed = true
    ;(async () => {
      try {
        const unlisten = await listen<number>(ProgressChannel, (event) => {
          const progress = event.payload
          if (progress < 0) {
            produce((draft) => {
              draft.busy = true
              draft.progress = undefined
            })
          } else {
            produce((draft) => {
              draft.progress = Math.round(progress * ProgressMax)
            })
          }
        })

        try {
          await updaterUpdate({ progressChannel: ProgressChannel })
        } finally {
          unlisten()
        }
      } catch (e) {
        produce((draft) => {
          draft.busy = false
        })
        notifier.error(i18n.t('Updater.ErrorTitle'), {
          body: errorTranslation(i18n, e),
          timeout: notifier.DefaultTimeouts.error * 2,
          dismissible: true,
        })
        throw e
      }

      produce((draft) => {
        draft.success = true
      })
    })()
  }, [i18n, notifier, produce])

  const handleExit = useCallback<MouseEventHandler>((evt) => {
    evt.preventDefault()
    exit(0)
  }, [])

  if (!state.busy === null) {
    return null
  }

  return (
    <Dialog
      modalType="alert"
      surfaceMotion={null}
      open={state.busy}
    >
      <DialogSurface className={styles.surface}>
        <div className={styles.container}>
          {!state.success
            ? (<Fragment>
                <Locale
                  component={Body1}
                  as="p"
                  block
                  mapping={['Updater.Updating.Title']}
                />
                <Field
                  validationMessage={<Locale mapping={[
                    'Updater.Updating.Progress',
                    {
                      max: 100,
                      value: state.progress,
                      context: state.progress === undefined
                        ? 'Indeterminate'
                        : undefined,
                    },
                  ]} />}
                  validationState="none"
                >
                  <ProgressBar
                    thickness="large"
                    max={ProgressMax}
                    value={state.progress}
                  />
                </Field>
              </Fragment>)
            : (<Fragment>
                <Locale
                  component={Body1}
                  as="p"
                  block
                  mapping={['Updater.Success.Title']}
                />
                <Locale component={Caption1} mapping={['Updater.Success.Subtitle']} />
                <Locale
                  component={Button}
                  appearance="primary"
                  onClick={handleExit}
                  mapping={['Updater.Success.ExitBtn']}
                />
              </Fragment>)
          }
        </div>
      </DialogSurface>
    </Dialog>
  )
}
