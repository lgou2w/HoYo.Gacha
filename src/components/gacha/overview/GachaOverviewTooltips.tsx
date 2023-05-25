import React from "react";
import { resolveCurrency } from "@/interfaces/account";
import { useGachaLayoutContext } from "@/components/gacha/GachaLayoutContext";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

export default function GachaOverviewTooltips() {
  const { facet, gachaRecords } = useGachaLayoutContext();
  const { total, firstTime, lastTime } = gachaRecords;
  const { currency, action } = resolveCurrency(facet);

  return (
    <Box>
      <Typography>
        {`· total ${action} `}
        <Typography component="span" color="primary">
          {total}
        </Typography>
        {" times, total value "}
        <Typography component="span" color="warning.light">
          {total * 160}
        </Typography>
        {` ${currency}。`}
        {"equivalent to cash"}
        <Typography component="span" color="error">
          {"￥"}
          <Typography
            component="span"
            title="Note: This amount is not the actual recharge amount, it is for reference only。"
          >
            {Math.floor((total * 160) / 8080) * 648}
          </Typography>
        </Typography>
        {" Yuan "}
      </Typography>
      <Typography>
        {`· ${action} record date coverage：`}
        <Typography component="span" color="secondary">
          {dayjs(firstTime).format("YYYY.MM.DD HH:mm:ss")}
        </Typography>
        {" ~ "}
        <Typography component="span" color="secondary">
          {dayjs(lastTime).format("YYYY.MM.DD HH:mm:ss")}
        </Typography>
        {"。"}
      </Typography>
      <Typography>
        {
          "· Due to official settings, there is a delay of about one hour in the latest data."
        }
        {
          "The delay may be longer if you encounter the peak period of the new pool. Please refer to the in-game data for the specific time。"
        }
      </Typography>
    </Box>
  );
}
