import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import ThemeProvider from 'react-bootstrap/ThemeProvider'

import 'bootstrap/dist/css/bootstrap.rtl.min.css'
import './App.css'
import App from './App'

const root = document.getElementById('root')
if (root === null) {
  throw new Error('missing #root element')
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider dir="rtl">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
