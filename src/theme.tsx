import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { enUS } from "@mui/material/locale";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import "@/assets/global.css";

const theme = createTheme(
  {
    typography: {
      fontFamily: "汉仪文黑-85W",
    },
  },
  enUS
);

export default function Theme(props: React.PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <Box display="flex">
        <CssBaseline />
        {props.children}
      </Box>
    </ThemeProvider>
  );
}
