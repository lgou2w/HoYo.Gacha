import React from 'react'
import AppSidebar from '@/components/Sidebar'
import AppContent from '@/components/Content'

export default function AppLayout (props: React.PropsWithChildren) {
  return (
    <React.Fragment>
      <AppSidebar />
      <AppContent>
        {props.children}
      </AppContent>
    </React.Fragment>
  )
}
