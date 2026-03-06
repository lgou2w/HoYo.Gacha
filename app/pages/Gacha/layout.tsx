import { BusinessProvider } from './contexts/Business'
import { ClientareaProvider } from './contexts/Clientarea'
import gachaBusinessRoute from './route'
import RootView from './views/Root'

export default function GachaBusinessLayout () {
  const { business } = gachaBusinessRoute.useLoaderData()

  return (
    <BusinessProvider key={business} value={business}>
      <ClientareaProvider>
        <RootView />
      </ClientareaProvider>
    </BusinessProvider>
  )
}
