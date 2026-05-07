import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Nav({ crumbs = [] }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <nav style={{
      background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
      padding: '0 28px', display: 'flex', alignItems: 'center', height: 50,
      position: 'sticky', top: 0, zIndex: 50
    }}>
      {/* Logo + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500, color: 'var(--blue)', letterSpacing: '.08em', marginRight: 8 }}>GK</span>
        <span style={{ color: 'var(--border-2)', marginRight: 4 }}>|</span>

        {/* Links principais */}
        {[{ to: '/clientes', label: 'Clientes' }, { to: '/cotacoes', label: 'Cotações' }].map(link => (
          <span key={link.to} onClick={() => navigate(link.to)} style={{
            fontSize: 12, cursor: 'pointer', padding: '3px 8px', borderRadius: 5,
            color: location.pathname.startsWith(link.to) ? 'var(--text)' : 'var(--text-2)',
            fontWeight: location.pathname.startsWith(link.to) ? 500 : 400,
            background: location.pathname.startsWith(link.to) ? 'var(--bg-3, #f0f0f0)' : 'transparent',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = location.pathname.startsWith(link.to) ? 'var(--text)' : 'var(--text-2)'}
          >{link.label}</span>
        ))}

        {crumbs.length > 0 && <span st
