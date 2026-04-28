import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Clientes from './pages/Clientes'
import ClienteDetail from './pages/ClienteDetail'
import ContratoDetail from './pages/ContratoDetail'
import EquipamentoDetail from './pages/EquipamentoDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/clientes" replace />} />
      <Route path="/clientes" element={<Clientes />} />
      <Route path="/clientes/:id" element={<ClienteDetail />} />
      <Route path="/contratos/:id" element={<ContratoDetail />} />
      <Route path="/equipamentos/:id" element={<EquipamentoDetail />} />
    </Routes>
  )
}
