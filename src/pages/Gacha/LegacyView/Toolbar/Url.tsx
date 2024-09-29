import React from 'react'
import { Button, Field, Input, SplitButton, buttonClassNames, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowClockwiseRegular, CopyRegular, LinkRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalL
  }
})

export default function GachaLegacyViewToolbarUrl () {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <GachaLegacyViewToolbarUrlInput />
      <GachaLegacyViewToolbarUrlButton />
    </div>
  )
}

const useInputStyles = makeStyles({
  root: {},
  inner: {
    maxWidth: '12rem'
  }
})

interface InputProps {
  value?: string
}

function GachaLegacyViewToolbarUrlInput (props: InputProps) {
  const classes = useInputStyles()
  return (
    <Field
      className={classes.root}
      label={{
        size: 'small',
        children: 'Gacha URL'
      }}
    >
      <Input
        className={classes.inner}
        contentBefore={<LinkRegular />}
        contentAfter={(
          <Button
            icon={<CopyRegular />}
            appearance="subtle"
            shape="circular"
          />
        )}
        size="large"
        appearance="outline"
        placeholder="Gacha URL"
        value={props.value ?? ''}
        readOnly
      />
    </Field>
  )
}

const useButtonStyles = makeStyles({
  root: {
    alignSelf: 'flex-end',
    minHeight: '2.5rem',
    [`& .${buttonClassNames.icon}`]: {
      fontSize: tokens.fontSizeBase500,
      width: tokens.fontSizeBase500,
      height: tokens.fontSizeBase500
    }
  }
})

function GachaLegacyViewToolbarUrlButton () {
  const classes = useButtonStyles()
  return (
    <SplitButton
      className={classes.root}
      appearance="primary"
      icon={<ArrowClockwiseRegular />}
    >Update</SplitButton>
  )
}
