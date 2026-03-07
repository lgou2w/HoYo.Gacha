import { MouseEventHandler, ReactNode, useCallback, useState } from 'react'
import { Button, ButtonProps, buttonClassNames, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { CheckmarkRegular, CopyRegular } from '@fluentui/react-icons'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'

const useStyles = makeStyles({
  copied: {
    color: tokens.colorStatusSuccessForeground1,
    [`&:hover, &:hover .${buttonClassNames.icon}`]: {
      color: tokens.colorStatusSuccessForeground1,
    },
  },
})

export interface CopyButtonProps extends Pick<ButtonProps,
  'appearance' | 'shape' | 'size' | 'disabled' | 'disabledFocusable'
> {
  className?: string
  content?: string | null | (() => Promise<string>)
  delay?: number
  children?: (copied: boolean) => ReactNode
}

export default function CopyButton (props: CopyButtonProps) {
  const { className, content, delay = 3000, children, ...rest } = props
  const styles = useStyles()

  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback<MouseEventHandler>(() => {
    if (!content || copied) {
      return
    }

    const promise = typeof content === 'string'
      ? Promise.resolve(content)
      : content()

    promise
      .then(async (value) => {
        await writeText(value)
        console.debug(`Copied to clipboard: ${value}`)
        setCopied(true)
        setTimeout(() => setCopied(false), delay)
      })
      .catch((err) => {
        console.error('Failed to write text to clipboard:', err)
      })
  }, [content, copied, delay])

  return (
    <Button
      as="button"
      className={mergeClasses(className, copied && styles.copied)}
      icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
      onClick={handleCopy}
      {...rest}
    >
      {children?.(copied)}
    </Button>
  )
}
