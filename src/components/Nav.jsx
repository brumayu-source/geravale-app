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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500, color: 'var(--blue)', letterSpacing: '.08em', marginRight: 8 }}>GK</span>
        <span style={{ color: 'var(--border-2)', marginRight: 4 }}>|</span>

        {[{ to: '/clientes', label: 'Clientes' }, { to: '/cotacoes', label: 'Cotações' }].map(link => {
          const ativo = location.pathname.startsWith(link.to)
          return (
            <span
              key={link.to}
              onClick={() => navigate(link.to)}
              style={{
                fontSize: 12,
                cursor: 'pointer',
                padding: '3px 8px',
                borderRadius: 5,
                color: ativo ? 'var(--text)' : 'var(--text-2)',
                fontWeight: ativo ? 500 : 400,
                background: ativo ? 'var(--bg-3, #2a2a2a)' : 'transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.color = ativo ? 'var(--text)' : 'var(--text-2)' }}
            >
              {link.label}
            </span>
          )
        })}

        {crumbs.length > 0 && (
          <span style={{ color: 'var(--border-2)', fontSize: 11, margin: '0 2px' }}>›</span>
        )}

        {crumbs.map((cr, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: 'var(--border-2)', fontSize: 11 }}>›</span>}
            {cr.to
              ? <span onClick={() => navigate(cr.to)} style={{ fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
                  onMouseEnter={e => { e.target.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.target.style.color = 'var(--text-2)' }}>{cr.label}</span>
              : <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{cr.label}</span>
            }
          </React.Fragment>
        ))}
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{user.email}</span>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid var(--border-2)',
              borderRadius: 6, color: 'var(--text-3)', padding: '3px 10px',
              fontSize: 11, cursor: 'pointer', transition: 'color .15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red-text)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
          >
            Sair
          </button>
        </div>
      )}
    </nav>
  )
}
