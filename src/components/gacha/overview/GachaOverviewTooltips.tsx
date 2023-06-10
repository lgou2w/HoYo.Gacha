import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function GachaOverviewTooltips() {
  return (
    <Box>
      <Typography variant="caption">
        Due to official settings, there is a delay of about one hour in the
        latest data. Please refer to the in-game data for the specific time.
      </Typography>
    </Box>
  );
}
