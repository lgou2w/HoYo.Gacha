import React from "react";
import { AccountFacet } from "@/interfaces/account";
import {
  AdvancedGachaRecordsMetadata,
  NamedGachaRecords,
} from "@/hooks/useGachaRecordsQuery";
import { useGachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import GachaItemView from "@/components/gacha/GachaItemView";
import { SxProps, Theme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

export default function GachaAnalysisHistories() {
  return (
    <>
      <Box>
        <GachaAnalysisHistory rank={5} />
      </Box>
      <Divider />
      <Box>
        <GachaAnalysisHistory rank={4} />
      </Box>
    </>
  );
}

function rankMetadataForRecords(rank: number, records: NamedGachaRecords) {
  switch (rank) {
    case 4:
      return records.metadata.purple;
    case 5:
      return records.metadata.golden;
    default:
      return records.metadata.golden;
  }
}

function GachaAnalysisHistory({ rank }: { rank: number }) {
  const { facet, gachaRecords } = useGachaLayoutContext();
  const {
    namedValues: { character, weapon, permanent, newbie },
  } = gachaRecords;

  return (
    <>
      <Typography variant="h6" gutterBottom>
        ❖ {rank}★ History
      </Typography>
      <Stack direction="column" spacing={2}>
        <GachaAnalysisHistoryList
          facet={facet}
          rank={rank}
          categoryTitle={character.categoryTitle}
          records={rankMetadataForRecords(rank, character)}
        />
        <GachaAnalysisHistoryList
          facet={facet}
          rank={rank}
          categoryTitle={weapon.categoryTitle}
          records={rankMetadataForRecords(rank, weapon)}
        />
        <GachaAnalysisHistoryList
          facet={facet}
          rank={rank}
          categoryTitle={permanent.categoryTitle}
          records={rankMetadataForRecords(rank, permanent)}
        />
        {rankMetadataForRecords(rank, newbie).sum > 0 && (
          <GachaAnalysisHistoryList
            facet={facet}
            rank={rank}
            categoryTitle={newbie.categoryTitle}
            records={rankMetadataForRecords(rank, newbie)}
          />
        )}
      </Stack>
    </>
  );
}

function GachaAnalysisHistoryList({
  facet,
  rank,
  categoryTitle,
  records,
}: {
  facet: AccountFacet;
  rank: number;
  categoryTitle: string;
  records: AdvancedGachaRecordsMetadata;
}) {
  return (
    <Stack
      className={GachaAnalysisHistoryListCls}
      sx={GachaAnalysisHistoryListSx}
      data-rank={rank}
    >
      <Box className={`${GachaAnalysisHistoryListCls}-title`}>
        <Typography>{categoryTitle}</Typography>
        {/* <Typography variant="body2">{records.sum}</Typography> */}
      </Box>
      <Divider orientation="horizontal" variant="fullWidth" />
      <Stack className={`${GachaAnalysisHistoryListCls}-items`}>
        {records.values.length === 0 ? (
          <Typography sx={{ color: "#7f7f7f" }}>No records found</Typography>
        ) : (
          records.values.map((item) => (
            <GachaItemView
              facet={facet}
              key={item.id}
              name={item.name}
              id={item.item_id || item.name}
              isWeapon={item.item_type === "Light Cone"}
              rank={item.rank_type}
              size={GachaAnalysisHistoryItemViewSize}
              usedPity={item.usedPity}
              restricted={item.restricted}
            />
          ))
        )}
      </Stack>
    </Stack>
  );
}

const GachaAnalysisHistoryItemViewSize = 84;
const GachaAnalysisHistoryListCls = "gacha-analysis-history-list";
const GachaAnalysisHistoryListSx: SxProps<Theme> = {
  flexDirection: "row",
  minHeight: GachaAnalysisHistoryItemViewSize,
  [`& .${GachaAnalysisHistoryListCls}-title`]: {
    width: 100,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
    textAlign: "center",
  },
  "& .MuiDivider-root": {
    width: "2px",
    borderWidth: 1,
    marginX: 1.5,
  },
  [`& .${GachaAnalysisHistoryListCls}-items`]: {
    gap: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  [`&[data-rank="5"] .MuiDivider-root`]: {
    borderColor: "warning.light",
  },
  [`&[data-rank="4"] .MuiDivider-root`]: {
    borderColor: "secondary.light",
  },
};
