import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'

ReactDOM
  .createRoot(window.document.getElementById('root')!)
  .render(
    <StrictMode>
      <App />
    </StrictMode>
  )
