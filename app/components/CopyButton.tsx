import { MouseEventHandler, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Button, ButtonProps, buttonClassNames, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { CheckmarkRegular, CopyRegular } from '@fluentui/react-icons'
import { writeSecret, writeText } from '@tauri-apps/plugin-clipboard-manager'

const useStyles = makeStyles({
  copied: {
    color: tokens.colorStatusSuccessForeground1,
    [`&:hover, &:hover .${buttonClassNames.icon}`]: {
      color: tokens.colorStatusSuccessForeground1,
    },
  },
})

export interface CopyButtonProps extends Pick<ButtonProps,
  'appearance' | 'shape' | 'size' | 'disabled' | 'disabledFocusable' | 'aria-label'
> {
  className?: string
  content?: string | null | (() => string | Promise<string>)
  delay?: number
  /** @see {writeSecret} */
  secret?: boolean
  children?: (copied: boolean) => ReactNode
}

export default function CopyButton (props: CopyButtonProps) {
  const { className, content, delay = 3000, secret, children, ...rest } = props
  const styles = useStyles()

  const [copied, setCopied] = useState(false)
  const pendingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timer = timerRef.current
    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [])

  const handleCopy = useCallback<MouseEventHandler>(() => {
    if (content == null || pendingRef.current) {
      return
    }

    pendingRef.current = true
    Promise.resolve()
      .then(() => typeof content === 'string' ? content : content?.())
      .then(async (value) => {
        console.debug('Copied to clipboard:', value)
        if (secret) {
          await writeSecret(value)
        } else {
          await writeText(value)
        }

        setCopied(true)
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current)
        }

        timerRef.current = setTimeout(() => {
          timerRef.current = null
          setCopied(false)
        }, delay)
      })
      .catch((error) => {
        console.error('Failed to write text to clipbard:', error)
      })
      .finally(() => {
        pendingRef.current = false
      })
  }, [content, delay, secret])

  return (
    <Button
      className={mergeClasses(className, copied && styles.copied)}
      icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
      onClick={handleCopy}
      {...rest}
    >
      {children?.(copied)}
    </Button>
  )
}
