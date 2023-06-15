import React from "react";
import { GachaRecords, NamedGachaRecords } from "@/hooks/useGachaRecordsQuery";
import { useGachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import { SxProps, Theme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function GachaAnalysisSum() {
  const { gachaRecords } = useGachaLayoutContext();
  const {
    namedValues: { character, weapon, permanent, newbie },
    aggregatedValues,
  } = gachaRecords;

  return (
    <Box className={GachaAnalysisSumCls} sx={GachaAnalysisSumSx}>
      <Typography variant="h6" gutterBottom>
        ❖ Data ratio
      </Typography>
      <Stack flexDirection="row" gap={2}>
        <GachaAnalysisSumCol
          title="Total / Rate"
          values={["5★", "4★", "3★", "Total"]}
        />
        <GachaAnalysisSumCol
          title={character.categoryTitle}
          values={computeNamedGachaRecordsValues(character)}
        />
        <GachaAnalysisSumCol
          title={weapon.categoryTitle}
          values={computeNamedGachaRecordsValues(weapon)}
        />
        <GachaAnalysisSumCol
          title={permanent.categoryTitle}
          values={computeNamedGachaRecordsValues(permanent)}
        />
        <GachaAnalysisSumCol
          title={newbie.categoryTitle}
          values={computeNamedGachaRecordsValues(newbie)}
        />
        <GachaAnalysisSumCol
          title="Total"
          values={computeNamedGachaRecordsValues(aggregatedValues)}
        />
      </Stack>
    </Box>
  );
}

function computeNamedGachaRecordsValues(
  data: NamedGachaRecords | GachaRecords["aggregatedValues"]
) {
  const {
    metadata: { golden, purple, blue },
    total,
  } = data;
  return [
    [golden.sum, golden.sumPercentage + "%", "warning.main"],
    [purple.sum, purple.sumPercentage + "%", "secondary.main"],
    [blue.sum, blue.sumPercentage + "%", "info.main"],
    [total, total > 0 ? "100%" : "0%"],
  ];
}

function GachaAnalysisSumCol(props: {
  title: React.ReactNode;
  values: [React.ReactNode, React.ReactNode, string?][] | React.ReactNode[];
}) {
  const { title, values } = props;
  return (
    <Stack className={`${GachaAnalysisSumCls}-col`}>
      <Typography variant="body1" textAlign="center" bgcolor="grey.100">
        {title}
      </Typography>
      {values.map((value, index) =>
        Array.isArray(value) ? (
          <Box key={index} textAlign="center" color={value[2]}>
            <Typography component="span">{value[0]}</Typography>
            <Typography component="span" marginX={1} color="grey.800">
              /
            </Typography>
            <Typography component="span">{value[1]}</Typography>
          </Box>
        ) : (
          <Typography key={index} textAlign="center" bgcolor="grey.100">
            {value}
          </Typography>
        )
      )}
    </Stack>
  );
}

const GachaAnalysisSumCls = "gacha-analysis-sum";
const GachaAnalysisSumSx: SxProps<Theme> = {
  [`& .${GachaAnalysisSumCls}-col`]: {
    width: 140,
    flexGrow: 1,
    fontSize: "1rem",
    border: 2,
    borderBottom: 0,
    borderColor: "grey.300",
    borderRadius: 1,
    "& > *": {
      paddingY: 0.5,
      borderBottom: 2,
      borderColor: "inherit",
    },
  },
};
