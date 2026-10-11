import { Image } from '@fluentui/react-components'
import Nav from './Nav'

export default function BrandNav () {
  return (
    <Nav
      pathname="/"
      icon={<Image src="/Logo.avif" alt="logo" />}
    />
  )
}
