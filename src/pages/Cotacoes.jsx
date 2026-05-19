import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import Layout from '../components/Layout'

// ── Utilitários ───────────────────────────────────────────────────────────────
const fmt = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const diasDesde = (iso) => {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

const diasAte = (iso) => {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

const STATUS_LABEL = {
  aguardando:    'Aguardando',
  contato_feito: 'Contato feito',
  aprovado:      'Aprovado',
  recusado:      'Recusado',
  reagendar:     'Reagendar',
}

const STATUS_COLOR = {
  aguardando:    { bg: '#FAEEDA', color: '#633806', border: '#EF9F27' },
  contato_feito: { bg: '#E6F1FB', color: '#0C447C', border: '#85B7EB' },
  aprovado:      { bg: '#EAF3DE', color: '#27500A', border: '#97C459' },
  recusado:      { bg: '#FCEBEB', color: '#791F1F', border: '#F09595' },
  reagendar:     { bg: '#EEEDFE', color: '#3C3489', border: '#7F77DD' },
}

const TIPO_COLOR = {
  realizado:   { bg: '#E1F5EE', color: '#085041', border: '#5DCAA5', accent: '#5DCAA5', label: 'Serviço realizado' },
  recomendado: { bg: '#EEEDFE', color: '#3C3489', border: '#7F77DD', accent: '#7F77DD', label: 'Serviço recomendado' },
}

// ── Estilos base ──────────────────────────────────────────────────────────────
const s = {
  page:  { padding: '28px 32px', maxWidth: 1100, margin: '0 auto' },
  input: {
    width: '100%', padding: '8px 12px', fontSize: 13,
    border: '1px solid var(--border, #e5e7eb)', borderRadius: 7,
    background: 'var(--bg, #fff)', color: 'var(--text, #111)',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2, #666)', marginBottom: 5 },
  btn: (variant = 'primary') => ({
    padding: '7px 16px', borderRadius: 7, fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
    background: variant === 'primary' ? 'var(--blue, #1F3864)' : 'transparent',
    color: variant === 'primary' ? '#fff' : 'var(--text, #111)',
    border: variant === 'secondary' ? '1px solid var(--border, #e5e7eb)' : 'none',
  }),
  card: {
    background: 'var(--bg-2, #fff)',
    border: '0.5px solid var(--border, #e5e7eb)',
    borderRadius: '0 10px 10px 0',
    padding: '14px 16px',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
}

// ── Componentes ───────────────────────────────────────────────────────────────
function Badge({ bg, color, border, children }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 500,
      padding: '2px 8px', borderRadius: 20, marginRight: 4,
      background: bg, color, border: `0.5px solid ${border}`,
    }}>
      {children}
    </span>
  )
}

function Alerta({ proximo, status, diasEnvio }) {
  if (status === 'aprovado' || status === 'recusado') return null
  if (proximo) {
    const d = diasAte(proximo)
    if (d < 0)  return <span style={{ fontSize: 10, fontWeight: 600, color: '#A32D2D', marginLeft: 6 }}>⚠ Follow-up atrasado {Math.abs(d)}d</span>
    if (d === 0) return <span style={{ fontSize: 10, fontWeight: 600, color: '#854F0B', marginLeft: 6 }}>⚠ Follow-up hoje</span>
    if (d <= 2)  return <span style={{ fontSize: 10, fontWeight: 600, color: '#854F0B', marginLeft: 6 }}>⚠ Follow-up em {d}d</span>
  }
  if (diasEnvio > 20 && status === 'aguardando')
    return <span style={{ fontSize: 10, fontWeight: 600, color: '#A32D2D', marginLeft: 6 }}>⚠ Sem retorno há {diasEnvio}d</span>
  return null
}

function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div style={{
        background: 'var(--bg-2, #fff)', borderRadius: 12,
        width, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto',
        padding: '24px 28px', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-2)' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Fg({ label, children, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  )
}

// ── Formulário ────────────────────────────────────────────────────────────────
function FormCotacao({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    tipo: 'realizado',
    cliente: '',
    descricao: '',
    omie: '',
    os: '',
    data_envio: new Date().toISOString().split('T')[0],
    proximo_followup: '',
    status: 'aguardando',
    observacoes: '',
    ...initial,
    valor: initial.valor != null ? String(initial.valor) : '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.cliente.trim()) return alert('Informe o nome do cliente.')
    if (!form.descricao.trim()) return alert('Informe a descrição do serviço.')
    onSave({
      ...form,
      valor: form.valor ? parseFloat(form.valor) : null,
      proximo_followup: form.proximo_followup || null,
      omie: form.omie || null,
      os: form.os || null,
    })
  }

  const tipoBtn = (tipo) => ({
    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
    cursor: 'pointer',
    background: form.tipo === tipo ? TIPO_COLOR[tipo].bg : 'transparent',
    color: form.tipo === tipo ? TIPO_COLOR[tipo].color : 'var(--text-2)',
    border: `1px solid ${form.tipo === tipo ? TIPO_COLOR[tipo].border : 'var(--border, #e5e7eb)'}`,
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>

      <Fg label="Tipo de cotação" span={2}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={tipoBtn('realizado')}  onClick={() => set('tipo', 'realizado')}>Serviço realizado</button>
          <button style={tipoBtn('recomendado')} onClick={() => set('tipo', 'recomendado')}>Serviço recomendado</button>
        </div>
      </Fg>

      <Fg label="Cliente *" span={2}>
        <input style={s.input} value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Nome do cliente" />
      </Fg>

      <Fg label="Descrição do serviço *" span={2}>
        <input style={s.input} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Troca de filtros de ar e separador" />
      </Fg>

      <Fg label="N° Omie">
        <input style={s.input} value={form.omie} onChange={e => set('omie', e.target.value)} placeholder="Ex: 4821" />
      </Fg>

      <Fg label="N° OS">
        <input style={s.input} value={form.os} onChange={e => set('os', e.target.value)} placeholder="Ex: 72831844" />
      </Fg>

      <Fg label="Valor (R$)">
        <input style={s.input} type="number" step="0.01" value={form.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" />
      </Fg>

      <Fg label="Data de envio">
        <input style={s.input} type="date" value={form.data_envio} onChange={e => set('data_envio', e.target.value)} />
      </Fg>

      <Fg label="Próximo follow-up">
        <input style={s.input} type="date" value={form.proximo_followup} onChange={e => set('proximo_followup', e.target.value)} />
      </Fg>

      <Fg label="Status">
        <select style={s.input} value={form.status} onChange={e => set('status', e.target.value)}>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Fg>

      <Fg label="Observações" span={2}>
        <textarea
          style={{ ...s.input, minHeight: 72, resize: 'vertical' }}
          value={form.observacoes}
          onChange={e => set('observacoes', e.target.value)}
          placeholder="Notas internas, contexto do cliente, próximos passos..."
        />
      </Fg>

      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
        <button style={s.btn('secondary')} onClick={onClose}>Cancelar</button>
        <button style={s.btn('primary')}   onClick={handleSave}>Salvar</button>
      </div>
    </div>
  )
}

// ── Card de cotação ───────────────────────────────────────────────────────────
function CardCotacao({ c, onEdit, onDelete, onArquivar }) {
  const tc = TIPO_COLOR[c.tipo]
  const sc = STATUS_COLOR[c.status] || STATUS_COLOR.aguardando
  const dias = diasDesde(c.data_envio)

  const refNums = [c.omie && `Omie ${c.omie}`, c.os && `OS ${c.os}`].filter(Boolean).join(' · ')

  return (
    <div style={{ ...s.card, borderLeft: `3px solid ${tc.accent}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
          <Badge {...tc}>{tc.label}</Badge>
          <Badge {...sc}>{STATUS_LABEL[c.status]}</Badge>
          <Alerta proximo={c.proximo_followup} status={c.status} diasEnvio={dias} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{c.cliente}</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {c.descricao}
          {refNums && <span style={{ marginLeft: 8, fontSize: 11, opacity: .6 }}>{refNums}</span>}
        </div>
        {c.observacoes && (
          <div style={{ fontSize: 11, color: 'var(--text-2)', fontStyle: 'italic', marginTop: 5, opacity: .85 }}>
            {c.observacoes}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', minWidth: 140 }}>
        {c.valor != null && (
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
            R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
          Enviado {fmt(c.data_envio)}{dias !== null ? ` · ${dias}d atrás` : ''}
        </div>
        {c.proximo_followup && (
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
            Próximo: {fmt(c.proximo_followup)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8, flexWrap: 'wrap' }}>
          <button onClick={() => onEdit(c)} style={{ ...s.btn('secondary'), padding: '4px 12px', fontSize: 11 }}>Editar</button>
          {c.status === 'aprovado' && !c.arquivado && (
            <button onClick={() => onArquivar(c)} style={{ ...s.btn('secondary'), padding: '4px 12px', fontSize: 11, color: '#085041', borderColor: '#5DCAA5' }}>
              Arquivar
            </button>
          )}
          <button onClick={() => onDelete(c)} style={{ ...s.btn('secondary'), padding: '4px 12px', fontSize: 11, color: '#A32D2D', borderColor: '#F09595' }}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Métricas ──────────────────────────────────────────────────────────────────
function Metricas({ cotacoes }) {
  const ativas   = cotacoes.filter(c => !c.arquivado)
  const pendentes = ativas.filter(c => c.status === 'aguardando' || c.status === 'contato_feito').length
  const aprovados = ativas.filter(c => c.status === 'aprovado').length
  const atrasados = ativas.filter(c => {
    if (c.status === 'aprovado' || c.status === 'recusado') return false
    return c.proximo_followup && diasAte(c.proximo_followup) < 0
  }).length
  const valorAprov = ativas
    .filter(c => c.status === 'aprovado' && c.valor)
    .reduce((acc, c) => acc + Number(c.valor), 0)

  const mc = (label, val, color) => (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--text)' }}>{val}</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
      {mc('Total ativo', ativas.length)}
      {mc('Em aberto', pendentes, pendentes > 0 ? '#854F0B' : undefined)}
      {mc('Aprovadas', aprovados, '#27500A')}
      {mc('Follow-ups atrasados', atrasados, atrasados > 0 ? '#A32D2D' : undefined)}
      {mc('Valor aprovado', `R$ ${valorAprov.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '#085041')}
    </div>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function Cotacoes() {
  const { user } = useAuth()
  const [cotacoes, setCotacoes]   = useState([])
  const [modal, setModal]         = useState(null)   // null | 'new' | obj
  const [confirmar, setConfirmar] = useState(null)
  const [confirmarArquivar, setConfirmarArquivar] = useState(null)
  const [filtro, setFiltro]       = useState({ tipo: '', status: '', busca: '', arquivo: 'ativas' })
  const [loading, setLoading]     = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('cotacoes').select('*').order('data_envio', { ascending: false })
    setCotacoes(data || [])
    setLoading(false)
  }

  async function salvar(dados) {
    const payload = { ...dados, criado_por: user?.email || '' }
    if (modal === 'new') {
      await supabase.from('cotacoes').insert([payload])
    } else {
      await supabase.from('cotacoes').update(payload).eq('id', modal.id)
    }
    setModal(null)
    load()
  }

  async function excluir(c) {
    await supabase.from('cotacoes').delete().eq('id', c.id)
    setConfirmar(null)
    load()
  }

  async function arquivar(c) {
    await supabase.from('cotacoes').update({ arquivado: true }).eq('id', c.id)
    setConfirmarArquivar(null)
    load()
  }

  // Filtros
  const visiveis = cotacoes.filter(c => {
    if (filtro.arquivo === 'ativas'     && c.arquivado)  return false
    if (filtro.arquivo === 'arquivadas' && !c.arquivado) return false
    if (filtro.tipo   && c.tipo   !== filtro.tipo)   return false
    if (filtro.status && c.status !== filtro.status) return false
    if (filtro.busca) {
      const q = filtro.busca.toLowerCase()
      const campos = [c.cliente, c.descricao, c.os, c.omie, c.observacoes].map(v => (v || '').toLowerCase())
      if (!campos.some(v => v.includes(q))) return false
    }
    return true
  })

  const porTipo = (tipo) => visiveis.filter(c => c.tipo === tipo)
  const setF = (k, v) => setFiltro(f => ({ ...f, [k]: v }))

  const sectionPill = (count, tc) => (
    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: tc.bg, color: tc.color, border: `0.5px solid ${tc.border}` }}>
      {count}
    </span>
  )

  return (
    <Layout crumbs={[{ label: 'Cotações' }]}>
    <div style={s.page}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Follow-up de cotações</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '4px 0 0' }}>Controle de cotações enviadas e serviços recomendados</p>
        </div>
        <button style={s.btn('primary')} onClick={() => setModal('new')}>+ Nova cotação</button>
      </div>

      {/* Métricas */}
      {!loading && <Metricas cotacoes={cotacoes} />}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          style={{ ...s.input, width: 220 }}
          placeholder="Buscar cliente, serviço, Omie ou OS..."
          value={filtro.busca}
          onChange={e => setF('busca', e.target.value)}
        />
        <select style={{ ...s.input, width: 180 }} value={filtro.tipo} onChange={e => setF('tipo', e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="realizado">Serviço realizado</option>
          <option value="recomendado">Serviço recomendado</option>
        </select>
        <select style={{ ...s.input, width: 170 }} value={filtro.status} onChange={e => setF('status', e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select style={{ ...s.input, width: 140 }} value={filtro.arquivo} onChange={e => setF('arquivo', e.target.value)}>
          <option value="ativas">Ativas</option>
          <option value="arquivadas">Arquivadas</option>
          <option value="todas">Todas</option>
        </select>
        {(filtro.tipo || filtro.status || filtro.busca || filtro.arquivo !== 'ativas') && (
          <button style={s.btn('secondary')} onClick={() => setFiltro({ tipo: '', status: '', busca: '', arquivo: 'ativas' })}>
            Limpar
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: 48, color: 'var(--text-2)' }}>Carregando...</p>
      ) : visiveis.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-2)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <p style={{ marginBottom: 16 }}>Nenhuma cotação encontrada.</p>
          <button style={s.btn('primary')} onClick={() => setModal('new')}>Registrar primeira cotação</button>
        </div>
      ) : (
        <>
          {porTipo('realizado').length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F6E56' }}>Serviços realizados</span>
                {sectionPill(porTipo('realizado').length, TIPO_COLOR.realizado)}
              </div>
              {porTipo('realizado').map(c => (
                <CardCotacao key={c.id} c={c} onEdit={setModal} onDelete={setConfirmar} onArquivar={setConfirmarArquivar} />
              ))}
            </section>
          )}

          {porTipo('recomendado').length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3C3489' }}>Serviços recomendados</span>
                {sectionPill(porTipo('recomendado').length, TIPO_COLOR.recomendado)}
              </div>
              {porTipo('recomendado').map(c => (
                <CardCotacao key={c.id} c={c} onEdit={setModal} onDelete={setConfirmar} onArquivar={setConfirmarArquivar} />
              ))}
            </section>
          )}
        </>
      )}

      {/* Modal novo/editar */}
      {modal && (
        <Modal title={modal === 'new' ? 'Nova cotação' : 'Editar cotação'} onClose={() => setModal(null)} width={600}>
          <FormCotacao initial={modal === 'new' ? {} : modal} onSave={salvar} onClose={() => setModal(null)} />
        </Modal>
      )}


      {/* Confirmar arquivar */}
      {confirmarArquivar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 12, padding: 24, width: 380 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Arquivar cotação?</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>A cotação ficará oculta mas não será excluída.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.btn('secondary')} onClick={() => setConfirmarArquivar(null)}>Cancelar</button>
              <button style={s.btn('primary')} onClick={() => arquivar(confirmarArquivar)}>Arquivar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {confirmar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: '24px 28px', maxWidth: 360, width: '90vw' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Excluir cotação?</div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
              "{confirmar.descricao}" — essa ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button style={s.btn('secondary')} onClick={() => setConfirmar(null)}>Cancelar</button>
              <button style={{ ...s.btn('primary'), background: '#A32D2D' }} onClick={() => excluir(confirmar)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  )
}
