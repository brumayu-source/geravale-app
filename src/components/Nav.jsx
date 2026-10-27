import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import logo from '../assets/logo.png'

const LINKS = [
  { to: '/conferidor',  label: 'Conferidor',    icon: '✓' },
  { to: '/manual',      label: 'Manual Fiscal',  icon: '📖' },
  { to: '/fluxo',       label: 'Fluxo',          icon: '⬡' },
  { to: '/recibo',      label: 'Recibo',         icon: '🧾' },
]

export default function Nav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate('/conferidor')}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginRight: 32, flexShrink: 0 }}
      >
        <img src={logo} alt="Gera Vale Kompressoren" style={{ height: 28, width: 'auto' }} />
      </div>

      {/* Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {LINKS.map(link => {
          const ativo = location.pathname.startsWith(link.to)
          return (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, padding: '6px 12px', borderRadius: 7,
                border: 'none',
                color: ativo ? 'var(--gv-black)' : 'var(--text-2)',
                fontWeight: ativo ? 600 : 400,
                background: ativo ? 'var(--gv-yellow-lt)' : 'transparent',
                transition: 'all .15s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!ativo) { e.currentTarget.style.background = 'var(--bg-2)'; e.currentTarget.style.color = 'var(--text)' } }}
              onMouseLeave={e => { if (!ativo) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' } }}
            >
              {ativo && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gv-yellow)', flexShrink: 0 }} />
              )}
              {link.label}
            </button>
          )
        })}
      </div>

      {/* Usuário */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--gv-yellow-lt)',
            border: '1.5px solid var(--gv-yellow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--gv-yellow-dk)',
            flexShrink: 0,
          }}>
            {(user.email || '?')[0].toUpperCase()}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-2)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid var(--border-2)',
              borderRadius: 6, color: 'var(--text-3)', padding: '4px 12px',
              fontSize: 12, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            Sair
          </button>
        </div>
      )}
    </nav>
  )
}
