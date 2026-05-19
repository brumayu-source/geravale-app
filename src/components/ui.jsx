import React from 'react'

// ── Layout ────────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  )
}

export function Section({ title, children, action }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)' }}>{title}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 18px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color .15s',
      ...style
    }}
      onMouseEnter={onClick ? e => e.currentTarget.style.borderColor = 'var(--blue)' : undefined}
      onMouseLeave={onClick ? e => e.currentTarget.style.borderColor = 'var(--border)' : undefined}
    >
      {children}
    </div>
  )
}

export function InfoGrid({ items }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 1, background: 'var(--border)', borderRadius: 'var(--radius)',
      overflow: 'hidden', border: '1px solid var(--border)'
    }}>
      {items.map(([label, value]) => (
        <div key={label} style={{ background: 'var(--bg-2)', padding: '10px 14px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{value || '—'}</div>
        </div>
      ))}
    </div>
  )
}

// ── Buttons ───────────────────────────────────────────────────────────────────
const btnBase = { border: 'none', borderRadius: 'var(--radius)', padding: '7px 16px', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'opacity .15s' }

export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, style }) {
  const variants = {
    primary: { background: 'var(--blue)', color: '#fff' },
    secondary: { background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border-2)' },
    danger: { background: 'transparent', color: 'var(--red-text)', border: '1px solid var(--red-bg)' },
    ghost: { background: 'transparent', color: 'var(--text-2)', border: 'none' },
    success: { background: 'var(--green-bg)', color: 'var(--green-text)', border: '1px solid var(--green)' },
  }
  const sizes = { sm: { padding: '4px 10px', fontSize: 11 }, md: {}, lg: { padding: '9px 20px', fontSize: 14 } }
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...btnBase, ...variants[variant], ...sizes[size], opacity: disabled ? .5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
      {children}
    </button>
  )
}

export function BackBtn({ onClick, label = 'Voltar' }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, cursor: 'pointer', padding: 0 }}>
      ‹ {label}
    </button>
  )
}

export function IconBtn({ onClick, children, title, variant = 'ghost' }) {
  return (
    <button onClick={onClick} title={title} style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 6, color: 'var(--text-2)', padding: '4px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}
    </button>
  )
}

// ── Badges ────────────────────────────────────────────────────────────────────
export function Badge({ tipo }) {
  const map = {
    manutencao: { bg: 'var(--blue-bg)', color: 'var(--blue-text)', label: 'Manutenção' },
    locacao: { bg: 'var(--orange-bg)', color: 'var(--orange-text)', label: 'Locação' },
    preventiva: { bg: 'var(--blue-bg)', color: 'var(--blue-text)', label: 'Preventiva' },
    corretiva: { bg: 'var(--yellow-bg)', color: 'var(--yellow-text)', label: 'Corretiva' },
    arquivado: { bg: 'var(--bg-3)', color: 'var(--text-3)', label: 'Arquivado' },
  }
  const s = map[tipo] || { bg: 'var(--bg-3)', color: 'var(--text-2)', label: tipo }
  return <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>
}

export function SaldoBadge({ usado, total }) {
  const saldo = total - usado
  const pct = total > 0 ? saldo / total : 1
  const cls = pct <= 0 ? { bg: 'var(--red-bg)', color: 'var(--red-text)' }
    : pct <= .25 ? { bg: 'var(--yellow-bg)', color: 'var(--yellow-text)' }
    : { bg: 'var(--green-bg)', color: 'var(--green-text)' }
  return <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, ...cls, whiteSpace: 'nowrap' }}>{saldo}/{total}</span>
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ cols, rows, onRowClick }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{cols.map(c => <th key={c.key || c.label} style={{ background: 'var(--bg-3)', color: 'var(--text-2)', fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 12px', textAlign: c.align || 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default', transition: 'background .1s' }}
              onMouseEnter={onRowClick ? e => e.currentTarget.style.background = 'var(--bg-3)' : undefined}
              onMouseLeave={onRowClick ? e => e.currentTarget.style.background = '' : undefined}>
              {cols.map(col => (
                <td key={col.key || col.label} style={{ padding: '10px 12px', fontSize: 12, color: col.muted ? 'var(--text-2)' : 'var(--text)', borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', textAlign: col.align || 'left', fontFamily: col.mono ? 'DM Mono, monospace' : 'inherit' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={cols.length} style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Nenhum registro encontrado.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose, width = 480 }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--radius-lg)', padding: 24, width, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Form ──────────────────────────────────────────────────────────────────────
export function FormGroup({ label, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'var(--red-text)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export function FormRow({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)}, 1fr)`, gap: 12 }}>{children}</div>
}

export function BtnRow({ children }) {
  return <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>{children}</div>
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
export function Confirm({ message, onConfirm, onCancel, danger = false }) {
  return (
    <Modal title="Confirmar ação" onClose={onCancel} width={380}>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>{message}</p>
      <BtnRow>
        <Btn variant="secondary" onClick={onCancel}>Cancelar</Btn>
        <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirmar</Btn>
      </BtnRow>
    </Modal>
  )
}

// ── Row item ──────────────────────────────────────────────────────────────────
export function RowItem({ icon, title, subtitle, right, onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '11px 14px', cursor: onClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, transition: 'border-color .15s' }}
      onMouseEnter={onClick ? e => e.currentTarget.style.borderColor = 'var(--blue)' : undefined}
      onMouseLeave={onClick ? e => e.currentTarget.style.borderColor = 'var(--border)' : undefined}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon && <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</div>}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
    </div>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
export function MetricCard({ label, value, unit, sub, barPct, barColor }) {
  return (
    <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>{value}<span style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 3 }}>{unit}</span></div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>{sub}</div>}
      {barPct !== undefined && (
        <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, barPct)}%`, background: barColor || 'var(--green)', borderRadius: 2, transition: 'width .3s' }} />
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export const fmtDate = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = (iso.includes('T') ? iso.split('T')[0] : iso).split('-')
  return `${d}/${m}/${y}`
}

export const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
