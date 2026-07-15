import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppProvider, useApp } from './lib/store'
import { Layout } from './components/Layout'
import { AuthGate } from './components/AuthGate'
import Dashboard from './pages/Dashboard'
import Caisse from './pages/Caisse'
import Prospects from './pages/Prospects'
import Social from './pages/Social'
import Reglages from './pages/Reglages'

function Shell() {
  const { ready, mode } = useApp()

  if (!ready) {
    return (
      <div className="min-h-full grid place-items-center">
        <Loader2 className="animate-spin text-brand-soft" size={28} />
      </div>
    )
  }

  if (mode === 'cloud-auth') {
    return <AuthGate />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/caisse" element={<Caisse />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/reseaux" element={<Social />} />
        <Route path="/reglages" element={<Reglages />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppProvider>
  )
}
