import React from 'react'
import { Outlet } from 'react-router-dom'
import Content from '@/components/Core/Content'

export default function Root () {
  return (
    <React.Fragment>
      <Content>
        <Outlet />
      </Content>
    </React.Fragment>
  )
}
