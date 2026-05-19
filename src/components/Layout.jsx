import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const SECTIONS = [
  {
    to: '/clientes',
    label: 'Clientes',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </svg>
    ),
  },
  {
    to: '/cotacoes',
    label: 'Cotações',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside style={{
      width: 200,
      minHeight: '100vh',
      background: 'var(--bg-2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        borderBottom: '1px solid var(--border)',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'var(--blue)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '.05em' }}>GK</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>Gera Vale</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.2 }}>Kompresoren</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '10px 8px', flex: 1 }}>
        {SECTIONS.map(s => {
          const ativo = location.pathname.startsWith(s.to)
          return (
            <div
              key={s.to}
              onClick={() => navigate(s.to)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 7,
                cursor: 'pointer',
                marginBottom: 2,
                background: ativo ? 'var(--bg-3)' : 'transparent',
                color: ativo ? 'var(--text)' : 'var(--text-2)',
                transition: 'background .12s, color .12s',
                fontWeight: ativo ? 500 : 400,
                fontSize: 13,
              }}
              onMouseEnter={e => {
                if (!ativo) {
                  e.currentTarget.style.background = 'var(--bg-3)'
                  e.currentTarget.style.color = 'var(--text)'
                }
              }}
              onMouseLeave={e => {
                if (!ativo) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-2)'
                }
              }}
            >
              <span style={{ flexShrink: 0, opacity: ativo ? 1 : 0.7 }}>{s.icon}</span>
              {s.label}
            </div>
          )
        })}
      </nav>

      {/* User + logout */}
      <div style={{
        padding: '12px 12px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', background: 'none',
            border: '1px solid var(--border-2)',
            borderRadius: 6, color: 'var(--text-3)',
            padding: '5px 0', fontSize: 11,
            cursor: 'pointer', transition: 'color .15s, border-color .15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--red-text)'
            e.currentTarget.style.borderColor = 'var(--red-bg)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-3)'
            e.currentTarget.style.borderColor = 'var(--border-2)'
          }}
        >
          Sair
        </button>
      </div>
    </aside>
  )
}

// Topbar com breadcrumb — fica no topo da área de conteúdo
export function Topbar({ crumbs = [] }) {
  const navigate = useNavigate()
  return (
    <div style={{
      height: 46,
      background: 'var(--bg-2)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 6,
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {crumbs.map((cr, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: 'var(--border-2)', fontSize: 11 }}>›</span>}
          {cr.to
            ? <span
                onClick={() => navigate(cr.to)}
                style={{ fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', padding: '2px 4px', borderRadius: 4 }}
                onMouseEnter={e => { e.target.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.target.style.color = 'var(--text-2)' }}
              >{cr.label}</span>
            : <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{cr.label}</span>
          }
        </React.Fragment>
      ))}
    </div>
  )
}

// Layout wrapper — envolve sidebar + conteúdo
export default function Layout({ crumbs, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 200, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar crumbs={crumbs} />
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
