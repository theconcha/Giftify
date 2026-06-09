import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Home from './pages/Home'
import People from './pages/People'
import PersonDetail from './pages/PersonDetail'
import Occasions from './pages/Occasions'
import OccasionDetail from './pages/OccasionDetail'
import Gifts from './pages/Gifts'
import GiftDetail from './pages/GiftDetail'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Settings from './pages/Settings'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-svh bg-[#FAF6F1] flex items-center justify-center">
        <span className="text-[#8B7355] text-sm">Loading…</span>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="people" element={<People />} />
        <Route path="people/:id" element={<PersonDetail />} />
        <Route path="occasions" element={<Occasions />} />
        <Route path="occasions/:id" element={<OccasionDetail />} />
        <Route path="gifts" element={<Gifts />} />
        <Route path="gifts/:id" element={<GiftDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
