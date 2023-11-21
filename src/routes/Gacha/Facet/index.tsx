import React, { Fragment, Suspense } from 'react'
import { Await } from 'react-router-dom'
import { useQueryLoaderFunctionData } from '@/api/store'
import loader from './loader'

export default function GachaFacet () {
  const data = useQueryLoaderFunctionData<typeof loader>()
  return (
    <Fragment>
      <p>Facet: {data.facet}</p>
      <Suspense fallback="Loading...">
        <Await resolve={data.records}>
          {(records) => (
            <div>
              {records}
            </div>
          )}
        </Await>
      </Suspense>
    </Fragment>
  )
}
