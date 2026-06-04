import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AppRoutes } from './router'
import { Boot } from './components/Boot'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boot>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </Boot>
  </StrictMode>,
)
