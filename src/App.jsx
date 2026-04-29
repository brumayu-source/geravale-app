import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Clientes from './pages/Clientes'
import ClienteDetail from './pages/ClienteDetail'
import ContratoDetail from './pages/ContratoDetail'
import EquipamentoDetail from './pages/EquipamentoDetail'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/clientes" replace />} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/clientes/:id" element={<ProtectedRoute><ClienteDetail /></ProtectedRoute>} />
        <Route path="/contratos/:id" element={<ProtectedRoute><ContratoDetail /></ProtectedRoute>} />
        <Route path="/equipamentos/:id" element={<ProtectedRoute><EquipamentoDetail /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  )
}
