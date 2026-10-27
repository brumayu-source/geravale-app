import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import logo from '../assets/logo.png'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(form.email, form.password)
    setLoading(false)
    if (error) {
      setError('E-mail ou senha incorretos.')
    } else {
      navigate('/clientes', { replace: true })
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={logo} alt="Gera Vale Kompressoren" style={{ height: 44, width: 'auto' }} />
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 10, letterSpacing: '.03em' }}>
            Sistema Fiscal Interno
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '32px 28px',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Entrar na sua conta
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
              Acesso restrito a usuários cadastrados
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                E-mail
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="seu@email.com"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                Senha
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--red-bg)',
                border: '1px solid #FCA5A5',
                color: 'var(--red)',
                fontSize: 12,
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'var(--bg-3)' : 'var(--gv-black)',
                color: loading ? 'var(--text-3)' : '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '11px',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all .15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--gv-yellow)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--gv-black)' }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-3)', marginTop: 20 }}>
          Conta criada pelo administrador · Gera Vale Kompressoren
        </p>
      </div>
    </div>
  )
}
