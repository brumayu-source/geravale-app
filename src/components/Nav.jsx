import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Nav({ crumbs = [] }) {
  const navigate = useNavigate()

  return (
    <nav style={{
      background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
      padding: '0 28px', display: 'flex', alignItems: 'center', height: 50, gap: 6,
      position: 'sticky', top: 0, zIndex: 50
    }}>
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
    </nav>
  )
}
