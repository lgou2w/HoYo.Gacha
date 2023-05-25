import React from "react";
import Layout from "@/components/Layout";
import SettingAbout from "@/components/setting/SettingAbout";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

const Sections = [{ id: "about", title: "About", content: <SettingAbout /> }];

export default function Setting() {
  return (
    <Layout title="Settings">
      {Sections.map((section) => (
        <section key={section.id} id={section.id}>
          <Typography component="h2" variant="h6">
            {section.title}
          </Typography>
          <Divider sx={{ marginY: 2 }} />
          {section.content}
        </section>
      ))}
    </Layout>
  );
}
