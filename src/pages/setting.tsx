import React from 'react'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Page from '@/components/page'
import SettingSectionGeneral from '@/components/setting/section-general'
import SettingSectionAccount from '@/components/setting/section-account'
import SettingSectionAbout from '@/components/setting/section-about'

const Sections = [
  { id: 'generic', title: '常规', content: <SettingSectionGeneral /> },
  { id: 'account', title: '账号', content: <SettingSectionAccount /> },
  { id: 'about', title: '关于', content: <SettingSectionAbout /> }
]

export default function PageSetting () {
  return (
    <Page>
      {Sections.map((section) => (
        <section key={section.id} id={section.id}>
          <Typography component="h2" variant="h6">
            {section.title}
          </Typography>
          <Divider sx={{ marginY: 2 }} />
          {section.content}
        </section>
      ))}
    </Page>
  )
}
