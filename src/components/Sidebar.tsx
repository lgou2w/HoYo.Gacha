import React from "react";
import { Link, useLocation } from "react-router-dom";
import { styled, alpha } from "@mui/material/styles";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button, { ButtonTypeMap } from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoSrc from "@/assets/images/Logo.webp";
import StarRailLogoSrc from "@/assets/images/starrail/starrail-icon.jpeg";
import GenshinLogoSrc from "@/assets/images/genshin/genshin-icon.jpeg";
import PaimonTreasureSrc from "@/assets/images/Paimon.png";

export const SidebarWidth = "96px";

const GameIcon = styled((props: { src: string }) => {
  const { src } = props;
  return (
    <Box {...props}>
      <img src={src} alt="logo" />
    </Box>
  );
})(() => ({
  "& img": {
    borderRadius: "8px",
    maxWidth: 64,
    maxHeight: 64,
  },
}));

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SidebarWidth,
        flexShrink: 0,
        bgcolor: "#efefef",
        "& .MuiDrawer-paper": {
          width: SidebarWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar disableGutters>
        <Logo />
      </Toolbar>
      <Divider />
      <NavList />
    </Drawer>
  );
}

type Nav = { title: string; href: string; icon?: React.ReactNode };

const Navs: Nav[] = [
  { title: "Home", href: "/", icon: <GameIcon src={PaimonTreasureSrc} /> },
  {
    title: "Genshin Impact",
    href: "/genshin",
    icon: <GameIcon src={GenshinLogoSrc} />,
  },
  {
    title: "Honkai: Star Rail",
    href: "/starrail",
    icon: <GameIcon src={StarRailLogoSrc} />,
  },
];

const NavSetting: Nav = {
  title: "Settings",
  href: "/setting",
  icon: <SettingsIcon />,
};

function NavList() {
  return (
    <Box display="flex" flexDirection="column" height="100%" padding={1.5}>
      <Stack direction="column" spacing={2}>
        {Navs.map((nav, i) => (
          <NavListItem key={i} {...nav} />
        ))}
      </Stack>
      <Box marginTop="auto">
        <NavListItem {...NavSetting} />
      </Box>
    </Box>
  );
}

function NavListItem(props: Nav) {
  const { title, href, icon } = props;
  const location = useLocation();
  return (
    <NavListItemButton
      component={Link}
      to={href}
      activated={location.pathname === href}
      fullWidth
    >
      {icon}
      <Typography>{title}</Typography>
    </NavListItemButton>
  );
}

const NavListItemButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "activated",
})<{ activated: boolean }>(({ theme, activated }) => ({
  color: "inherit",
  paddingX: 0,
  paddingY: theme.spacing(0.5),
  display: "inline-flex",
  flexDirection: "column",
  textAlign: "center",
  "& .MuiSvgIcon-root": { fontSize: "2rem" },
  ...(activated && {
    color: theme.palette.primary.main,
    backgroundColor: alpha(
      theme.palette.primary.main,
      theme.palette.action.hoverOpacity + 0.05
    ),
    "&:hover": {
      backgroundColor: alpha(
        theme.palette.primary.main,
        theme.palette.action.hoverOpacity + 0.05
      ),
    },
  }),
})) as OverridableComponent<ButtonTypeMap<{ activated: boolean }>>;

const Logo = styled((props) => (
  <Box {...props}>
    <img src={LogoSrc} alt="logo" />
  </Box>
))(({ theme }) => ({
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  boxSizing: "border-box",
  userSelect: "none",
  "& img": {
    maxHeight: 64,
    width: "auto",
    display: "block",
    padding: theme.spacing(1, 0),
  },
}));
