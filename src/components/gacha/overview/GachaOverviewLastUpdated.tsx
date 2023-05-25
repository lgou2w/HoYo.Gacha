import React from "react";
import { resolveCurrency } from "@/interfaces/account";
import { useGachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

export default function GachaOverviewLastUpdated() {
  const { facet, selectedAccount } = useGachaLayoutContext();
  const { action } = resolveCurrency(facet);
  const lastGachaUpdated = selectedAccount.properties?.lastGachaUpdated;

  return (
    <Typography component="div" variant="subtitle2" color="grey.600">
      <Typography
        component="span"
        variant="inherit"
      >{`recently ${action} date of record update:`}</Typography>
      <Typography component="span" variant="inherit">
        {lastGachaUpdated ? dayjs(lastGachaUpdated).format("LLLL") : "none"}
      </Typography>
    </Typography>
  );
}
