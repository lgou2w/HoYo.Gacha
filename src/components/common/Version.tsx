import React from "react";
import { useQuery } from "@tanstack/react-query";
import invoke from "@/utilities/invoke";
import Typography, { TypographyProps } from "@mui/material/Typography";

export interface VersionProps extends TypographyProps {
  format?: (versionStr: string) => string;
}

export default function Version(props: VersionProps) {
  const version = useQuery({
    queryKey: ["get_version"],
    queryFn: async () => invoke<string>("get_version"),
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const { format, ...rest } = props;

  return (
    <Typography component="span" {...rest}>
      {format
        ? format(version.data || __APP_VERSION__)
        : version.data || __APP_VERSION__}
    </Typography>
  );
}
