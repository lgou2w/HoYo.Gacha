import React from "react";
import GachaAnalysisSum from "@/components/gacha/analysis/GachaAnalysisSum";
import GachaAnalysisHistories from "@/components/gacha/analysis/GachaAnalysisHistory";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import Tab from "@mui/material/Tab";
import TabPanel from "@mui/lab/TabPanel";
import { useGachaLayoutContext } from "../GachaLayoutContext";
import GachaAnalysisNamedRecords from "./GachaAnalysisNamedRecords";

export default function GachaAnalysis() {
  const { gachaRecords } = useGachaLayoutContext();
  const {
    namedValues: { character, weapon, permanent, newbie },
  } = gachaRecords;
  const [value, setValue] = React.useState("1");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", typography: "body1" }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Overall" value="1" />
            <Tab label={character.categoryTitle} value="2" />
            <Tab label={weapon.categoryTitle} value="3" />
            <Tab label={permanent.categoryTitle} value="4" />
            <Tab label={newbie.categoryTitle} value="5" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <Stack direction="column" spacing={2}>
            <GachaAnalysisSum />
            <GachaAnalysisHistories />
          </Stack>
        </TabPanel>
        <TabPanel value="2">
          <GachaAnalysisNamedRecords values={character} />
        </TabPanel>
        <TabPanel value="3">
          <GachaAnalysisNamedRecords values={weapon} />
        </TabPanel>
        <TabPanel value="4">
          <GachaAnalysisNamedRecords values={permanent} />
        </TabPanel>
        <TabPanel value="5">
          <GachaAnalysisNamedRecords values={newbie} />
        </TabPanel>
      </TabContext>
    </Box>
  );
}
