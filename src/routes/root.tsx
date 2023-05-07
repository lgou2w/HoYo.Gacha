import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import Content from '@/components/Content'

export default function Root () {
  return (
    <React.Fragment>
      <Sidebar />
      <Content>
        <Outlet />
      </Content>
    </React.Fragment>
  )
}
