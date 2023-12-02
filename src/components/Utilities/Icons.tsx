import React, { FC, SVGProps } from 'react'

function createBundleIcon (displayName: string, path: string) {
  const f: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} fill="currentColor" aria-hidden="true" width="1em" height="1em" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d={path} />
    </svg>
  )
  f.displayName = displayName
  return f
}

export const TrainRegular = createBundleIcon('TrainRegular', 'M12,2C8,2 4,2.5 4,6V15.5A3.5,3.5 0 0,0 7.5,19L6,20.5V21H8.23L10.23,19H14L16,21H18V20.5L16.5,19A3.5,3.5 0 0,0 20,15.5V6C20,2.5 16.42,2 12,2M7.5,17A1.5,1.5 0 0,1 6,15.5A1.5,1.5 0 0,1 7.5,14A1.5,1.5 0 0,1 9,15.5A1.5,1.5 0 0,1 7.5,17M11,10H6V6H11V10M13,10V6H18V10H13M16.5,17A1.5,1.5 0 0,1 15,15.5A1.5,1.5 0 0,1 16.5,14A1.5,1.5 0 0,1 18,15.5A1.5,1.5 0 0,1 16.5,17Z')

export const IdentifierRegular = createBundleIcon('IdentifierRegular', 'M10 7V9H9V15H10V17H6V15H7V9H6V7H10M16 7C17.11 7 18 7.9 18 9V15C18 16.11 17.11 17 16 17H12V7M16 9H14V15H16V9Z')
