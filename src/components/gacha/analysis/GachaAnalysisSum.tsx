import React from 'react'
import { GachaRecords, NamedGachaRecords } from '@/hooks/useGachaRecordsQuery'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import { SxProps, Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { AccountFacet } from '@/interfaces/account'

export default function GachaAnalysisSum () {
  const { facet, gachaRecords } = useGachaLayoutContext()
  const {
    namedValues: {
      character,
      weapon,
      permanent,
      newbie,
      anthology,
      bangboo,
      collaborationCharacter,
      collaborationWeapon
    },
    aggregatedValues
  } = gachaRecords

  const isZZZ = facet === AccountFacet.ZenlessZoneZero
  const hasAnthology = !!anthology && anthology.total > 0
  const hasBangboo = isZZZ && !!bangboo && bangboo.total > 0
  const hasCollaborationCharacter = facet === AccountFacet.StarRail && !!collaborationCharacter && collaborationCharacter.total > 0
  const hasCollaborationWeapon = facet === AccountFacet.StarRail && !!collaborationWeapon && collaborationWeapon.total > 0

  return (
    <Box className={GachaAnalysisSumCls} sx={GachaAnalysisSumSx}>
      <Typography variant="h6" gutterBottom>❖ 数据占比</Typography>
      <Stack flexDirection="row" gap={2}>
        <GachaAnalysisSumCol
          title="出货数 / 率"
          values={[
            ['五星', 'warning.main'],
            ['四星', 'secondary.main'],
            ['三星', 'info.main'],
            ['合计', 'grey.800']
          ]}
        />
        <GachaAnalysisSumCol title={character.categoryTitle} values={computeNamedGachaRecordsValues(character)} />
        <GachaAnalysisSumCol title={weapon.categoryTitle} values={computeNamedGachaRecordsValues(weapon)} />
        {hasAnthology && <GachaAnalysisSumCol title={anthology.categoryTitle} values={computeNamedGachaRecordsValues(anthology)} />}
        {hasCollaborationCharacter && <GachaAnalysisSumCol title={collaborationCharacter.categoryTitle} values={computeNamedGachaRecordsValues(collaborationCharacter)} />}
        {hasCollaborationWeapon && <GachaAnalysisSumCol title={collaborationWeapon.categoryTitle} values={computeNamedGachaRecordsValues(collaborationWeapon)} />}
        <GachaAnalysisSumCol title={permanent.categoryTitle} values={computeNamedGachaRecordsValues(permanent)} />
        {hasBangboo && <GachaAnalysisSumCol title={bangboo.categoryTitle} values={computeNamedGachaRecordsValues(bangboo)} />}
        {newbie.total > 0 && <GachaAnalysisSumCol title={newbie.categoryTitle} values={computeNamedGachaRecordsValues(newbie)} />}
        <GachaAnalysisSumCol
          title={isZZZ ? '合计（不含邦布）' : '合计'}
          values={computeNamedGachaRecordsValues(aggregatedValues)}
        />
      </Stack>
    </Box>
  )
}

function computeNamedGachaRecordsValues (
  data: NamedGachaRecords | GachaRecords['aggregatedValues']
): [React.ReactNode, React.ReactNode, string][] {
  const { metadata: { golden, purple, blue }, total } = data
  return [
    [golden.sum, golden.sumPercentage + '%', 'warning.main'],
    [purple.sum, purple.sumPercentage + '%', 'secondary.main'],
    [blue.sum, blue.sumPercentage + '%', 'info.main'],
    [total, total > 0 ? '100%' : '0%', 'grey.800']
  ]
}

function GachaAnalysisSumCol (props: {
  title: React.ReactNode,
  values: [React.ReactNode, React.ReactNode, string][] | [React.ReactNode, string][]
}) {
  const { title, values } = props
  return (
    <Stack className={`${GachaAnalysisSumCls}-col`}>
      <Typography
        variant="body1"
        textAlign="center"
        bgcolor="grey.100"
      >
        {title}
      </Typography>
      {values.map((value, index) => (
        value.length > 2
          ? <Box
              key={index}
              textAlign="center"
              color={value[2]}
            >
              <Typography component="span">{value[0]}</Typography>
              <Typography component="span" marginX={1} color="grey.800">/</Typography>
              <Typography component="span">{value[1]}</Typography>
            </Box>
          : <Typography
              key={index}
              textAlign="center"
              bgcolor="grey.100"
              color={value[1] as string}
            >{value[0]}</Typography>
      ))}
    </Stack>
  )
}

const GachaAnalysisSumCls = 'gacha-analysis-sum'
const GachaAnalysisSumSx: SxProps<Theme> = {
  [`& .${GachaAnalysisSumCls}-col`]: {
    width: 140,
    flexGrow: 1,
    fontSize: '1rem',
    border: 2,
    borderBottom: 0,
    borderColor: 'grey.300',
    borderRadius: 1,
    '& > *': {
      paddingY: 0.5,
      borderBottom: 2,
      borderColor: 'inherit'
    }
  }
}
