import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Brand theming via ?brand=nestle (or other)
try {
  const params = new URLSearchParams(window.location.search)
  const brand = params.get('brand')
  if (brand) {
    document.documentElement.dataset.brand = brand.toLowerCase()
  }
} catch (_) {
  // no-op in non-browser
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
