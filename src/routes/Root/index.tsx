import React, { Suspense } from 'react'
import { Await, Outlet } from 'react-router-dom'
import { useQueryLoaderFunctionData } from '@/api/store'
import Layout from '@/components/Core/Layout'
import loader from './loader'

export default function Root () {
  const data = useQueryLoaderFunctionData<typeof loader>()

  return (
    <Suspense fallback="Loading">
      <Await resolve={data.tasks}>
        <Layout>
          <Outlet />
        </Layout>
      </Await>
    </Suspense>
  )
}
