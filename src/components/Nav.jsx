import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Nav({ crumbs = [] }) {
  const navigate = useNavigate()
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
        {crumbs.map((cr, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: 'var(--border-2)', fontSize: 11 }}>›</span>}
            {cr.to
              ? <span onClick={() => navigate(cr.to)} style={{ fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
                  onMouseEnter={e => e.target.style.color = 'var(--text)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-2)'}>{cr.label}</span>
              : <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{cr.label}</span>
            }
          </React.Fragment>
        ))}
      </div>

      {/* Usuário + logout */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{user.email}</span>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid var(--border-2)',
            borderRadius: 6, color: 'var(--text-3)', padding: '3px 10px',
            fontSize: 11, cursor: 'pointer', transition: 'color .15s'
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            Sair
          </button>
        </div>
      )}
    </nav>
  )
}
