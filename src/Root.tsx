import React from 'react'
import { Outlet } from 'react-router-dom'
import Layout from '@/components/Core/Layout'

export default function Root () {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
