import React from 'react'
import { Outlet } from 'react-router-dom'
import Layout from '@/components/Core/Layout'
// import { useQueryLoaderFunctionData } from '@/store'
// import loader from './loader'

export default function Root () {
  // const data = useQueryLoaderFunctionData<typeof loader>()

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
