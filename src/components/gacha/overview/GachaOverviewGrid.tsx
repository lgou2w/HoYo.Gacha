import React from "react";
import { AccountFacet, resolveCurrency } from "@/interfaces/account";
import { GachaRecords, NamedGachaRecords } from "@/hooks/useGachaRecordsQuery";
import { useGachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import { SxProps, Theme } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import dayjs from "@/utilities/dayjs";

export default function GachaOverviewGrid() {
  const { facet, gachaRecords } = useGachaLayoutContext();
  const {
    namedValues: { character, weapon, permanent, newbie },
    aggregatedValues,
  } = gachaRecords;

  return (
    <Box>
      <Grid spacing={2} container>
        <Grid xs={6} item>
          <GachaOverviewGridCard facet={facet} value={character} />
        </Grid>
        <Grid xs={6} item>
          <GachaOverviewGridCard facet={facet} value={weapon} />
        </Grid>
        <Grid xs={6} item>
          <GachaOverviewGridCard facet={facet} value={permanent} />
        </Grid>
        <Grid xs={6} item>
          <GachaOverviewGridCard
            facet={facet}
            value={aggregatedValues}
            newbie={newbie}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

function GachaOverviewGridCard({
  facet,
  value,
  newbie,
}: {
  facet: AccountFacet;
  value: NamedGachaRecords | GachaRecords["aggregatedValues"];
  newbie?: NamedGachaRecords;
}) {
  const {
    total,
    firstTime,
    lastTime,
    metadata: { golden },
  } = value;
  const { currency } = resolveCurrency(facet);
  const category = "category" in value ? value.category : "aggregated";
  const categoryTitle =
    "categoryTitle" in value ? value.categoryTitle : "total";

  const lastGolden = golden.values[golden.values.length - 1];
  const lastGoldenName = lastGolden
    ? `${lastGolden.name}（${lastGolden.usedPity}）`
    : "none";

  const newbieGolden = newbie && newbie.metadata.golden.values[0];
  const newbieGoldenName = newbieGolden && `${newbieGolden.name}`;

  return (
    <Stack sx={GachaOverviewGridCardSx}>
      <Box className="category">
        <Typography component="div" variant="body2">
          {categoryTitle}
        </Typography>
      </Box>
      <Box>
        <Typography component="div" variant="h4">
          {categoryTitle}
          {category === "aggregated" && (
            <Typography variant="button">(including novices)</Typography>
          )}
        </Typography>
        <Typography component="div" variant="caption">
          {dayjs(firstTime).format("YYYY.MM.DD")}
          {" - "}
          {dayjs(lastTime).format("YYYY.MM.DD")}
        </Typography>
      </Box>
      <Stack className="labels">
        <Stack>
          <Chip label={`common ${total} smoke`} color="primary" />
          {category !== "aggregated" ? (
            <Chip
              label={`has been padded ${golden.nextPity} smoke`}
              color="secondary"
            />
          ) : (
            newbieGoldenName && (
              <Chip label={`Novice: ${newbieGoldenName}`} color="warning" />
            )
          )}
          <Chip label={`Been out ${golden.sum} money`} color="warning" />
        </Stack>
        <Stack>
          <Chip label={`Recent withdrawals: ${lastGoldenName}`} />
          <Chip label={`Withdrawal rate ${golden.sumPercentage}%`} />
        </Stack>
        <Stack>
          <Chip label={`average per gold ${golden.sumAverage} smoke`} />
          <Chip
            label={`average per gold ${golden.sumAverage * 160} ${currency}`}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}

const GachaOverviewGridCardSx: SxProps<Theme> = {
  gap: 2,
  position: "relative",
  height: "100%",
  padding: 2,
  border: 1.5,
  borderRadius: 2,
  borderColor: "grey.300",
  bgcolor: "grey.100",
  userSelect: "none",
  "& .category": {
    position: "absolute",
    top: 0,
    right: 0,
    paddingX: 2,
    paddingY: 0.5,
    color: "white",
    borderLeft: 2,
    borderBottom: 2,
    borderColor: "inherit",
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 6,
    bgcolor: "success.light",
    '&[data-aggregated="true"]': { bgcolor: "warning.light" },
  },
  "& .labels": {
    gap: 1,
    fontSize: "1rem",
    "& > .MuiStack-root": { flexDirection: "row", gap: 1 },
    "& > .MuiStack-root > .MuiChip-root": { fontSize: "inherit" },
  },
};
