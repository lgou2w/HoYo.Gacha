import React from "react";
import { AccountFacet, resolveCurrency } from "@/interfaces/account";
import {
  AdvancedGachaRecordsMetadata,
  GachaRecords,
  NamedGachaRecords,
} from "@/hooks/useGachaRecordsQuery";
import { useGachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import { SxProps, Theme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import GachaItemView from "../GachaItemView";

export default function GachaOverviewGrid() {
  const { facet, gachaRecords } = useGachaLayoutContext();
  const {
    namedValues: { character, weapon, permanent, newbie },
    aggregatedValues,
  } = gachaRecords;

  console.log("a", character, weapon, permanent, newbie);

  return (
    <Box>
      <Grid spacing={2} container>
        {character.total === 0 || (
          <Grid xs={6} item>
            <GachaOverviewGridCard facet={facet} value={character} />
          </Grid>
        )}

        {weapon.total === 0 || (
          <Grid xs={6} item>
            <GachaOverviewGridCard facet={facet} value={weapon} />
          </Grid>
        )}

        {permanent.total === 0 || (
          <Grid xs={6} item>
            <GachaOverviewGridCard facet={facet} value={permanent} />
          </Grid>
        )}
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

function GachaOverviewLast({
  facet,
  metadata,
}: {
  facet: AccountFacet;
  metadata: AdvancedGachaRecordsMetadata;
}) {
  const last = metadata.values[metadata.values.length - 1];
  const lastName = last ? last.name : "none";
  return (
    <Stack sx={{ gap: 1, flexBasis: "50%" }}>
      <Card
        sx={{
          position: "relative",
          textAlign: "center",
          flexShrink: 1,
        }}
      >
        <GachaItemView
          facet={facet}
          key={last.id}
          name={last.name}
          id={last.item_id || last.name}
          isWeapon={last.item_type === "Light Cone"}
          rank={last.rank_type}
          restricted={last.restricted}
        />

        <Typography
          variant="h6"
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "rgba(0, 0, 0, 0.5)",
            color: "#efefef",
            padding: "0 4px",
          }}
        >
          {lastName}
        </Typography>
        <Typography
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "rgba(0, 0, 0, 0.5)",
            color: "#efefef",
            borderBottomLeftRadius: "8px",
            padding: "0 8px",
          }}
          variant="caption"
        >
          {`Last ${last.rank_type}★`}
        </Typography>
      </Card>
      <Statistic
        title={`${last.rank_type}★ Rate`}
        statistic={`${metadata.sumPercentage}%`}
      />
      <Statistic
        title={`Avg. wishes per ${last.rank_type}★`}
        statistic={`${metadata.sumAverage}`}
      />
    </Stack>
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
    metadata: { golden, purple },
  } = value;
  const { action } = resolveCurrency(facet);
  const category = "category" in value ? value.category : "aggregated";
  const categoryTitle =
    "categoryTitle" in value ? value.categoryTitle : "Total";

  const newbieGolden = newbie && newbie.metadata.golden.values[0];
  const newbieGoldenName = newbieGolden && `${newbieGolden.name}`;

  if (total === 0) {
    return (
      <Card sx={GachaOverviewGridCardSx}>
        <Box className="category">
          <Typography component="div" variant="body2">
            {categoryTitle}
          </Typography>
        </Box>
        <Box>
          <Typography>No data available</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card sx={GachaOverviewGridCardSx}>
      <CardHeader
        title={categoryTitle}
        subheader={
          <Stack direction="row" gap={1}>
            <Chip
              label={`Lifetime ${action.plural}: ${total}`}
              color="primary"
            />
            {category !== "aggregated" ? (
              <Chip label={`5★ Pity: ${golden.nextPity}`} color="warning" />
            ) : (
              newbieGoldenName && (
                <Chip
                  label={`Novice 5★: ${newbieGoldenName}`}
                  color="warning"
                />
              )
            )}
            <Chip label={`4★ Pity: ${purple.nextPity}`} color="secondary" />
          </Stack>
        }
      ></CardHeader>
      <CardContent>
        <Stack direction="row" justifyContent="space-around" sx={{ gap: 2 }}>
          {golden.values.length === 0 || (
            <GachaOverviewLast facet={facet} metadata={golden} />
          )}

          {purple.values.length === 0 || (
            <GachaOverviewLast facet={facet} metadata={purple} />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

const GachaOverviewGridCardSx: SxProps<Theme> = {
  gap: 2,
  position: "relative",
  height: "100%",
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
    color: "#efefef",
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

function Statistic({ title, statistic }: { title: string; statistic: string }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ bgcolor: "grey.300", padding: "8px 12px", borderRadius: 2 }}
    >
      <Typography>{title}</Typography>
      <Typography variant="h5">{statistic}</Typography>
    </Stack>
  );
}
