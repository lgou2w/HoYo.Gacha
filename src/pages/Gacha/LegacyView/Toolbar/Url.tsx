import React from 'react'
import { Button, Input, Label, SplitButton, buttonClassNames, makeStyles, tokens } from '@fluentui/react-components'
import { ArrowClockwiseRegular, CopyRegular, LinkRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    columnGap: tokens.spacingHorizontalL,
  },
})

export default function GachaLegacyViewToolbarUrl () {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Label size="small">Gacha URL</Label>
      <div className={classes.content}>
        <GachaLegacyViewToolbarUrlInput />
        <GachaLegacyViewToolbarUrlButton />
      </div>
    </div>
  )
}

const useInputStyles = makeStyles({
  root: {
    maxWidth: '12rem',
  },
})

interface InputProps {
  value?: string
}

function GachaLegacyViewToolbarUrlInput (props: InputProps) {
  const classes = useInputStyles()
  return (
    <Input
      className={classes.root}
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
  )
}

const useButtonStyles = makeStyles({
  root: {
    alignSelf: 'flex-end',
    minHeight: '2.5rem',
    [`& .${buttonClassNames.icon}`]: {
      fontSize: tokens.fontSizeBase500,
      width: tokens.fontSizeBase500,
      height: tokens.fontSizeBase500,
    },
  },
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
