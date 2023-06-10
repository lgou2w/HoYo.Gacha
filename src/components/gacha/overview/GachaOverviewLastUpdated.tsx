import React from "react";
import { useGachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

export default function GachaOverviewLastUpdated() {
  const { selectedAccount } = useGachaLayoutContext();
  const lastGachaUpdated = selectedAccount.properties?.lastGachaUpdated;

  return (
    <Typography component="div" variant="subtitle2" color="grey.600">
      <Typography
        component="span"
        variant="inherit"
      >{`Last updated: `}</Typography>
      <Typography component="span" variant="inherit">
        {lastGachaUpdated ? dayjs(lastGachaUpdated).format("LLLL") : "unknown"}
      </Typography>
    </Typography>
  );
}
