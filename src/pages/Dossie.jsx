import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Badge, SaldoBadge, MetricCard, fmtDate } from '../components/ui'

// ── helpers ───────────────────────────────────────────────────────────────────
function barColor(pct) {
  return pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--yellow-text)' : 'var(--green)'
}

function pct(used, total) {
  return total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0
}

// ── Timeline item ─────────────────────────────────────────────────────────────
function VisitaItem({ visita, equipamentos, baixas, pecas }) {
  const [open, setOpen] = useState(false)
  const eq = equipamentos.find(e => e.contrato_id === visita.contrato_id)
  const vBaixas = baixas.filter(b => b.visita_id === visita.id)

  return (
    <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
      {/* Linha do tempo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', marginTop: 4, flexShrink: 0,
          background: visita.tipo === 'corretiva' ? 'var(--yellow-text)' : 'var(--blue)',
        }} />
        <div style={{ width: 1, flex: 1, background: 'var(--border)', marginTop: 4 }} />
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, paddingBottom: 4 }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>OS {visita.os}</span>
            <Badge tipo={visita.tipo} />
            {vBaixas.length > 0 && (
              <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: 'var(--bg-3)', color: 'var(--text-2)' }}>
                {vBaixas.length} baixa{vBaixas.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{fmtDate(visita.data)}</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{visita.horas}h · {visita.km}km</span>
            <span style={{ color: 'var(--border-2)', fontSize: 11, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>›</span>
          </div>
        </div>

        {visita.obs && <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>{visita.obs}</div>}

        {open && vBaixas.length > 0 && (
          <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: '10px 12px', marginTop: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 8 }}>
              Peças utilizadas
            </div>
            {vBaixas.map(b => {
              const p = pecas.find(x => x.id === b.peca_id)
              return (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{p?.descricao || '—'}</span>
                  <span style={{ color: 'var(--text-2)', fontFamily: 'DM Mono, monospace', fontSize: 11 }}>
                    {b.qtd} {p?.unidade} · {p?.codigo} {b.re_nf ? `· ${b.re_nf}` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {open && vBaixas.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Nenhuma peça baixada nesta visita.</div>
        )}
      </div>
    </div>
  )
}

// ── Comprovante pendente ───────────────────────────────────────────────────────
function PendenteBadge() {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'var(--yellow-bg)', color: 'var(--yellow-text)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      ⏳ OS pendente
    </span>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Dossie() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [cliente, setCliente] = useState(null)
  const [contratos, setContratos] = useState([])
  const [equipamentos, setEquipamentos] = useState([])
  const [visitas, setVisitas] = useState([])
  const [baixas, setBaixas] = useState([])
  const [pecas, setPecas] = useState([])
  const [filtroContrato, setFiltroContrato] = useState('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)

    const { data: cl } = await supabase.from('clientes').select('*').eq('id', id).single()
    setCliente(cl)

    const { data: cts } = await supabase.from('contratos').select('*').eq('cliente_id', id).neq('arquivado', true)
    setContratos(cts || [])

    if (!cts?.length) { setLoading(false); return }

    const ctIds = cts.map(c => c.id)

    const { data: eqs } = await supabase.from('equipamentos').select('*').in('contrato_id', ctIds).neq('arquivado', true)
    setEquipamentos(eqs || [])

    const eqIds = (eqs || []).map(e => e.id)

    const [{ data: vs }, { data: ps }] = await Promise.all([
      supabase.from('visitas').select('*').in('contrato_id', ctIds).order('data', { ascending: false }),
      eqIds.length > 0 ? supabase.from('pecas').select('*').in('equipamento_id', eqIds) : Promise.resolve({ data: [] }),
    ])

    setVisitas(vs || [])
    setPecas(ps || [])

    const pecaIds = (ps || []).map(p => p.id)
    if (pecaIds.length > 0) {
      const { data: bs } = await supabase.from('baixas').select('*').in('peca_id', pecaIds)
      setBaixas(bs || [])
    }

    setLoading(false)
  }

  if (loading) return <Layout crumbs={[{ label: 'Clientes', to: '/clientes' }, { label: '...' }]}><div style={{ padding: 28, color: 'var(--text-2)' }}>Carregando...</div></Layout>
  if (!cliente) return null

  // Filtros
  const meses = [...new Set(visitas.map(v => v.data?.slice(0, 7)))].sort().reverse()

  const visitasFiltradas = visitas.filter(v => {
    if (filtroContrato !== 'todos' && v.contrato_id !== filtroContrato) return false
    if (filtroPeriodo !== 'todos' && !v.data?.startsWith(filtroPeriodo)) return false
    return true
  })

  // Saldos por contrato de manutenção
  const contratosManu = contratos.filter(c => c.tipo === 'manutencao')

  // Comprovantes pendentes = baixas sem visita_id (pré-visita não vinculada)
  const baixasPendentes = baixas.filter(b => !b.visita_id)
  const eqsPendentes = [...new Set(baixasPendentes.map(b => {
    const p = pecas.find(x => x.id === b.peca_id)
    return p?.equipamento_id
  }).filter(Boolean))]

  return (
    <Layout crumbs={[
      { label: 'Clientes', to: '/clientes' },
      { label: cliente.razao_social, to: `/clientes/${id}` },
      { label: 'Dossiê' }
    ]}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 3 }}>{cliente.razao_social}</h1>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {contratos.map(ct => <Badge key={ct.id} tipo={ct.tipo} />)}
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{cliente.cnpj}</span>
            </div>
          </div>
          <button onClick={() => navigate(`/clientes/${id}`)}
            style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 6, color: 'var(--text-2)', padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
            ← Ver cadastro
          </button>
        </div>

        {/* Alertas: comprovantes pendentes */}
        {eqsPendentes.length > 0 && (
          <div style={{ background: 'var(--yellow-bg)', border: '1px solid var(--yellow-text)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--yellow-text)', marginBottom: 6 }}>
              ⏳ Comprovantes pré-visita sem OS vinculada
            </div>
            {eqsPendentes.map(eqId => {
              const eq = equipamentos.find(e => e.id === eqId)
              const bsPend = baixasPendentes.filter(b => pecas.find(p => p.id === b.peca_id && p.equipamento_id === eqId))
              return (
                <div key={eqId} style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 3 }}>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{eq?.fabricante} {eq?.modelo} · Série {eq?.serie}</span>
                  {' — '}{bsPend.length} item{bsPend.length !== 1 ? 'ns' : ''} aguardando OS
                  <button onClick={() => navigate(`/equipamentos/${eqId}`)}
                    style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--yellow-text)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                    ver equipamento →
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Saldos de contratos de manutenção */}
        {contratosManu.map(ct => {
          const vsContrato = visitas.filter(v => v.contrato_id === ct.id)
          const horasUsadas = vsContrato.reduce((s, v) => s + (+v.horas || 0), 0)
          const kmUsados = vsContrato.reduce((s, v) => s + (+v.km || 0), 0)
          const hp = pct(horasUsadas, ct.horas_contratadas)
          const kp = pct(kmUsados, ct.km_contratados)

          const eqsContrato = equipamentos.filter(e => e.contrato_id === ct.id)
          const pecasContrato = pecas.filter(p => eqsContrato.some(e => e.id === p.equipamento_id))
          const totalPecas = pecasContrato.length
          const pecasCriticas = pecasContrato.filter(p => {
            const usado = baixas.filter(b => b.peca_id === p.id).reduce((s, b) => s + b.qtd, 0)
            return p.qtd_contratada > 0 && (p.qtd_contratada - usado) / p.qtd_contratada <= 0.25
          }).length

          return (
            <div key={ct.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Badge tipo={ct.tipo} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>Contrato #{ct.numero}</span>
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{fmtDate(ct.inicio)} → {fmtDate(ct.termino)}</span>
                {pecasCriticas > 0 && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--red-bg)', color: 'var(--red-text)' }}>
                    ⚠ {pecasCriticas} peça{pecasCriticas !== 1 ? 's' : ''} crítica{pecasCriticas !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <MetricCard label="Horas contratadas" value={ct.horas_contratadas} unit="h" />
                <MetricCard label="Horas utilizadas" value={horasUsadas} unit="h" barPct={hp} barColor={barColor(hp)} />
                <MetricCard label="KM contratados" value={ct.km_contratados} unit="km" />
                <MetricCard label="KM utilizados" value={kmUsados} unit="km" barPct={kp} barColor={barColor(kp)} />
              </div>

              {/* Peças críticas */}
              {pecasCriticas > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 6 }}>Peças com saldo crítico (≤25%)</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {pecasContrato.filter(p => {
                      const usado = baixas.filter(b => b.peca_id === p.id).reduce((s, b) => s + b.qtd, 0)
                      return p.qtd_contratada > 0 && (p.qtd_contratada - usado) / p.qtd_contratada <= 0.25
                    }).map(p => {
                      const usado = baixas.filter(b => b.peca_id === p.id).reduce((s, b) => s + b.qtd, 0)
                      const eq = equipamentos.find(e => e.id === p.equipamento_id)
                      return (
                        <div key={p.id} style={{ background: 'var(--red-bg)', borderRadius: 'var(--radius)', padding: '6px 10px', fontSize: 11 }}>
                          <span style={{ color: 'var(--red-text)', fontWeight: 500 }}>{p.descricao}</span>
                          <span style={{ color: 'var(--text-2)', marginLeft: 6 }}>{p.qtd_contratada - usado}/{p.qtd_contratada} · {eq?.serie}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Filtros da timeline */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Filtrar</span>
          <select value={filtroContrato} onChange={e => setFiltroContrato(e.target.value)}
            style={{ fontSize: 12, padding: '5px 10px', width: 'auto' }}>
            <option value="todos">Todos os contratos</option>
            {contratos.map(ct => <option key={ct.id} value={ct.id}>Contrato #{ct.numero} ({ct.tipo === 'manutencao' ? 'Manutenção' : 'Locação'})</option>)}
          </select>
          <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}
            style={{ fontSize: 12, padding: '5px 10px', width: 'auto' }}>
            <option value="todos">Todo o período</option>
            {meses.map(m => {
              const [y, mo] = m.split('-')
              const nome = new Date(+y, +mo - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
              return <option key={m} value={m}>{nome}</option>
            })}
          </select>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{visitasFiltradas.length} visita{visitasFiltradas.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Timeline de visitas */}
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 14 }}>
          Linha do tempo
        </div>

        {visitasFiltradas.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-3)', padding: '20px 0' }}>Nenhuma visita encontrada para os filtros selecionados.</div>
        )}

        {visitasFiltradas.map(v => (
          <VisitaItem key={v.id} visita={v} equipamentos={equipamentos} baixas={baixas} pecas={pecas} />
        ))}

      </div>
    </Layout>
  )
}
