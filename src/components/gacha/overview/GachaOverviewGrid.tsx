import React from "react";
import { AccountFacet, resolveCurrency } from "@/interfaces/account";
import { GachaRecords, NamedGachaRecords } from "@/hooks/useGachaRecordsQuery";
import { useGachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import { SxProps, Theme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import dayjs from "@/utilities/dayjs";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import CardMedia from "@mui/material/CardMedia";
import AvatarStarRailTrailblazer from "@/assets/images/starrail/Trailblazer.png";

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
    metadata: { golden, purple },
  } = value;
  const { currency, action } = resolveCurrency(facet);
  const category = "category" in value ? value.category : "aggregated";
  const categoryTitle =
    "categoryTitle" in value ? value.categoryTitle : "Total";

  const lastGolden = golden.values[golden.values.length - 1];
  const lastGoldenName = lastGolden
    ? `${lastGolden.name}（${lastGolden.usedPity}）`
    : "none";

  const lastPurple = purple.values[purple.values.length - 1];
  const lastPurpleName = lastPurple ? `${lastPurple.name} ` : "none";

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
      <Box className="category">
        <Typography component="div" variant="body2">
          {categoryTitle}
        </Typography>
      </Box>
      <CardHeader
        title={
          <Typography component="div" variant="h4">
            {categoryTitle}
            {category === "aggregated" && (
              <Typography variant="button">
                &nbsp;(including novices)
              </Typography>
            )}
          </Typography>
        }
        subheader={
          <Typography component="div" variant="caption">
            {dayjs(firstTime).format("YYYY.MM.DD")}
            {" - "}
            {dayjs(lastTime).format("YYYY.MM.DD")}
          </Typography>
        }
      ></CardHeader>
      <CardContent>
        <Stack direction="row" justifyContent="space-around" sx={{ gap: 2 }}>
          <Stack sx={{ gap: 1, flexBasis: "50%" }}>
            <Card
              sx={{ position: "relative", textAlign: "center", flexShrink: 1 }}
            >
              <Typography
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  background: "#000",
                  color: "white",
                  borderBottomLeftRadius: "8px",
                  padding: "0 8px",
                }}
                variant="caption"
              >
                Last 5★
              </Typography>
              <CardMedia
                sx={{ height: 100 }}
                image={AvatarStarRailTrailblazer}
              />
              <CardHeader title={`${lastGoldenName}`} />
            </Card>
            <Statistic title="5★ Rate" statistic={`${golden.sumPercentage}%`} />
            <Statistic
              title="Avg. wishes per 5★"
              statistic={`${golden.sumAverage}`}
            />
            {/* <Chip
              label={`Avg. ${currency} spent per 5★: ${
                golden.sumAverage * 160
              }`}
            /> */}
          </Stack>

          <Stack sx={{ gap: 1, flexBasis: "50%" }}>
            <Card
              sx={{
                position: "relative",
                textAlign: "center",
                flexShrink: 1,
              }}
            >
              <Typography
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  background: "#000",
                  color: "white",
                  borderBottomLeftRadius: "8px",
                  padding: "0 8px",
                }}
                variant="caption"
              >
                Last 4★
              </Typography>
              <CardMedia
                sx={{ height: 100 }}
                image={AvatarStarRailTrailblazer}
              />
              <CardHeader title={`${lastPurpleName}`} />
            </Card>
            <Statistic title="4★ Rate" statistic={`${purple.sumPercentage}%`} />
            <Statistic
              title="Avg. wishes per 4★"
              statistic={`${purple.sumAverage}`}
            />
            {/* <Chip
              label={`Avg. ${currency} spent per 5★: ${
                golden.sumAverage * 160
              }`}
            /> */}
          </Stack>
        </Stack>
        <Stack direction="row">
          <Chip label={`Lifetime ${action.plural}: ${total}`} color="primary" />
          {category !== "aggregated" ? (
            <Chip label={`5★ Pity: ${golden.nextPity}`} color="secondary" />
          ) : (
            newbieGoldenName && (
              <Chip label={`Novice: ${newbieGoldenName}`} color="warning" />
            )
          )}
          <Chip label={`Been out ${golden.sum} money`} color="warning" />
        </Stack>
      </CardContent>
    </Card>
  );

  // return (
  //   <Card sx={GachaOverviewGridCardSx}>
  //     <Box className="category">
  //       <Typography component="div" variant="body2">
  //         {categoryTitle}
  //       </Typography>
  //     </Box>
  //     <Box>
  //       <Typography component="div" variant="h4">
  //         {categoryTitle}
  //         {category === "aggregated" && (
  //           <Typography variant="button">&nbsp;(including novices)</Typography>
  //         )}
  //       </Typography>
  //       <Typography component="div" variant="caption">
  //         {dayjs(firstTime).format("YYYY.MM.DD")}
  //         {" - "}
  //         {dayjs(lastTime).format("YYYY.MM.DD")}
  //       </Typography>
  //     </Box>
  //     <Stack className="labels">
  //       <Stack>
  //         <Chip label={`Lifetime ${action.plural}: ${total}`} color="primary" />
  //         {category !== "aggregated" ? (
  //           <Chip label={`5★ Pity: ${golden.nextPity}`} color="secondary" />
  //         ) : (
  //           newbieGoldenName && (
  //             <Chip label={`Novice: ${newbieGoldenName}`} color="warning" />
  //           )
  //         )}
  //         <Chip label={`Been out ${golden.sum} money`} color="warning" />
  //       </Stack>
  //       <Stack>
  //         <Chip label={`Last 5★: ${lastGoldenName}`} />
  //         <Chip label={`5★ Rate: ${golden.sumPercentage}%`} />
  //       </Stack>
  //       <Stack>
  //         <Chip label={`Avg. wishes per 5★: ${golden.sumAverage} `} />
  //         <Chip
  //           label={`Avg. ${currency} spent per 5★: ${golden.sumAverage * 160}`}
  //         />
  //       </Stack>
  //       <Stack>
  //         <Chip label={`Last 4★: ${lastPurpleName}`} />
  //         <Chip label={`4★ Rate: ${purple.sumPercentage}%`} />
  //       </Stack>
  //       <Stack>
  //         <Chip label={`Avg. wishes per 4★: ${purple.sumAverage} `} />
  //         <Chip
  //           label={`Avg. ${currency} spent per 4★: ${purple.sumAverage * 160}`}
  //         />
  //       </Stack>
  //     </Stack>
  //   </Card>
  // );
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
