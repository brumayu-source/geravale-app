import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Conferidor from './pages/Conferidor'
import Manual from './pages/Manual'
import Fluxo from './pages/Fluxo'
import Recibo from './pages/Recibo'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/conferidor" replace />} />
        <Route path="/conferidor" element={<ProtectedRoute><Conferidor /></ProtectedRoute>} />
        <Route path="/manual" element={<ProtectedRoute><Manual /></ProtectedRoute>} />
        <Route path="/fluxo" element={<ProtectedRoute><Fluxo /></ProtectedRoute>} />
        <Route path="/recibo" element={<ProtectedRoute><Recibo /></ProtectedRoute>} />
        {/* Rotas antigas — mantidas para não quebrar links salvos */}
        <Route path="/clientes/*" element={<Navigate to="/conferidor" replace />} />
        <Route path="/contratos/*" element={<Navigate to="/conferidor" replace />} />
        <Route path="/equipamentos/*" element={<Navigate to="/conferidor" replace />} />
        <Route path="/cotacoes" element={<Navigate to="/conferidor" replace />} />
      </Routes>
    </AuthProvider>
  )
}
