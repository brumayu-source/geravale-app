import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { fmtDate } from '../components/ui'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Export Excel (CSV simples que abre no Excel) ──────────────────────────────
function exportCSV(rows, filename) {
  const headers = ['Cliente', 'Contrato', 'Tipo', 'Equipamento', 'Modelo', 'Série', 'Código', 'Descrição', 'Qtd', 'Unidade', 'Data', 'OS', 'RE/NF']
  const lines = [headers.join(';'), ...rows.map(r => [
    r.cliente, r.contrato, r.tipo, r.equipamento, r.modelo, r.serie,
    r.codigo, r.descricao, r.qtd, r.unidade, r.data, r.os, r.re_nf
  ].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(';'))]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

// ── Export PDF ────────────────────────────────────────────────────────────────
function exportPDF(rows, filtros) {
  const doc = new jsPDF({ orientation: 'landscape' })
  const hoje = new Date()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(31, 56, 100)
  doc.text('GERA VALE KOMPRESOREN', 14, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text('Relatório de Gestão — Consumo de Peças', 14, 20)

  const filtroTexto = [
    filtros.cliente !== 'todos' ? `Cliente: ${filtros.clienteNome}` : null,
    filtros.periodo !== 'todos' ? `Período: ${filtros.periodo}` : null,
    filtros.modelo !== 'todos' ? `Modelo: ${filtros.modelo}` : null,
  ].filter(Boolean).join('  ·  ') || 'Todos os filtros'
  doc.text(filtroTexto, 14, 26)
  doc.text(`Gerado em: ${hoje.toLocaleDateString('pt-BR')} às ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 31)

  doc.setDrawColor(31, 56, 100)
  doc.setLineWidth(0.4)
  doc.line(14, 34, 283, 34)

  autoTable(doc, {
    startY: 38,
    head: [['Cliente', 'Contrato', 'Tipo', 'Equipamento', 'Modelo', 'Série', 'Código', 'Descrição', 'Qtd', 'Unid.', 'Data', 'OS']],
    body: rows.map(r => [r.cliente, r.contrato, r.tipo, r.equipamento, r.modelo, r.serie, r.codigo, r.descricao, r.qtd, r.unidade, r.data, r.os]),
    headStyles: { fillColor: [31, 56, 100], textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: 40 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: {
      0: { cellWidth: 30 }, 1: { cellWidth: 18 }, 2: { cellWidth: 18 },
      3: { cellWidth: 22 }, 4: { cellWidth: 20 }, 5: { cellWidth: 16 },
      6: { cellWidth: 22 }, 7: { cellWidth: 38 }, 8: { cellWidth: 12, halign: 'center' },
      9: { cellWidth: 12, halign: 'center' }, 10: { cellWidth: 20 }, 11: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
  })

  const filename = `gestao_${filtros.periodo !== 'todos' ? filtros.periodo : 'geral'}_${hoje.toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function Gestao() {
  const [clientes, setClientes] = useState([])
  const [allRows, setAllRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [filtroCliente, setFiltroCliente] = useState('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos')
  const [filtroModelo, setFiltroModelo] = useState('todos')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)

    // Busca tudo de uma vez
    const [
      { data: cls },
      { data: cts },
      { data: eqs },
      { data: ps },
      { data: bs },
      { data: vs },
    ] = await Promise.all([
      supabase.from('clientes').select('id, razao_social').neq('arquivado', true).order('razao_social'),
      supabase.from('contratos').select('id, cliente_id, numero, tipo').neq('arquivado', true),
      supabase.from('equipamentos').select('id, contrato_id, fabricante, modelo, serie').neq('arquivado', true),
      supabase.from('pecas').select('id, equipamento_id, descricao, codigo, unidade'),
      supabase.from('baixas').select('*'),
      supabase.from('visitas').select('id, contrato_id, os, data'),
    ])

    setClientes(cls || [])

    // Montar linhas desnormalizadas para a tabela
    const rows = (bs || []).map(b => {
      const p = (ps || []).find(x => x.id === b.peca_id)
      if (!p) return null
      const eq = (eqs || []).find(x => x.id === p.equipamento_id)
      if (!eq) return null
      const ct = (cts || []).find(x => x.id === eq.contrato_id)
      if (!ct) return null
      const cl = (cls || []).find(x => x.id === ct.cliente_id)
      if (!cl) return null
      const v = (vs || []).find(x => x.id === b.visita_id)

      return {
        id: b.id,
        cliente: cl.razao_social,
        cliente_id: cl.id,
        contrato: `#${ct.numero}`,
        tipo: ct.tipo === 'manutencao' ? 'Manutenção' : 'Locação',
        equipamento: `${eq.fabricante} ${eq.modelo}`,
        modelo: eq.modelo,
        serie: eq.serie,
        codigo: p.codigo || '—',
        descricao: p.descricao,
        qtd: b.qtd,
        unidade: p.unidade || '—',
        data: fmtDate(b.data),
        data_iso: b.data,
        periodo: b.data?.slice(0, 7) || '',
        os: b.os || v?.os || '—',
        re_nf: b.re_nf || '—',
      }
    }).filter(Boolean)

    rows.sort((a, b) => (b.data_iso || '').localeCompare(a.data_iso || ''))
    setAllRows(rows)
    setLoading(false)
  }

  // Opções de filtro derivadas dos dados
  const periodos = [...new Set(allRows.map(r => r.periodo))].filter(Boolean).sort().reverse()
  const modelos = [...new Set(allRows.map(r => r.modelo))].filter(Boolean).sort()

  // Filtrar
  const rows = allRows.filter(r => {
    if (filtroCliente !== 'todos' && r.cliente_id !== filtroCliente) return false
    if (filtroPeriodo !== 'todos' && r.periodo !== filtroPeriodo) return false
    if (filtroModelo !== 'todos' && r.modelo !== filtroModelo) return false
    return true
  })

  // Totais por código
  const totaisPorCodigo = rows.reduce((acc, r) => {
    const key = r.codigo
    if (!acc[key]) acc[key] = { codigo: r.codigo, descricao: r.descricao, unidade: r.unidade, total: 0, equipamentos: new Set() }
    acc[key].total += r.qtd
    acc[key].equipamentos.add(r.serie)
    return acc
  }, {})

  const totais = Object.values(totaisPorCodigo).sort((a, b) => b.total - a.total)

  const clienteNome = clientes.find(c => c.id === filtroCliente)?.razao_social || ''

  function handleExportCSV() {
    exportCSV(rows, `gestao_${filtroPeriodo !== 'todos' ? filtroPeriodo : 'geral'}_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  function handleExportPDF() {
    exportPDF(rows, { cliente: filtroCliente, clienteNome, periodo: filtroPeriodo, modelo: filtroModelo })
  }

  return (
    <Layout crumbs={[{ label: 'Gestão' }]}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 3 }}>Gestão de Consumo</h1>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Visão consolidada de peças utilizadas</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleExportCSV} disabled={rows.length === 0}
              style={{ fontSize: 12, padding: '7px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--text-2)', cursor: rows.length === 0 ? 'not-allowed' : 'pointer', opacity: rows.length === 0 ? .5 : 1 }}>
              ⬇ Excel / CSV
            </button>
            <button onClick={handleExportPDF} disabled={rows.length === 0}
              style={{ fontSize: 12, padding: '7px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--blue)', background: 'var(--blue-bg)', color: 'var(--blue-text)', cursor: rows.length === 0 ? 'not-allowed' : 'pointer', opacity: rows.length === 0 ? .5 : 1 }}>
              📄 Exportar PDF
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Filtros</span>

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>Cliente</div>
            <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} style={{ fontSize: 12, padding: '5px 10px', width: 'auto', minWidth: 180 }}>
              <option value="todos">Todos os clientes</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>Período</div>
            <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} style={{ fontSize: 12, padding: '5px 10px', width: 'auto', minWidth: 140 }}>
              <option value="todos">Todo o período</option>
              {periodos.map(m => {
                const [y, mo] = m.split('-')
                const nome = new Date(+y, +mo - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                return <option key={m} value={m}>{nome}</option>
              })}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 3 }}>Modelo</div>
            <select value={filtroModelo} onChange={e => setFiltroModelo(e.target.value)} style={{ fontSize: 12, padding: '5px 10px', width: 'auto', minWidth: 140 }}>
              <option value="todos">Todos os modelos</option>
              {modelos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {(filtroCliente !== 'todos' || filtroPeriodo !== 'todos' || filtroModelo !== 'todos') && (
            <button onClick={() => { setFiltroCliente('todos'); setFiltroPeriodo('todos'); setFiltroModelo('todos') }}
              style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer', marginLeft: 'auto', textDecoration: 'underline' }}>
              Limpar filtros
            </button>
          )}
        </div>

        {loading && <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Carregando...</div>}

        {!loading && (
          <>
            {/* Totais por código */}
            {totais.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10 }}>
                  Consolidado por código
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {totais.map(t => (
                    <div key={t.codigo} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text-2)', marginBottom: 2 }}>{t.codigo}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{t.descricao}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--blue-text)' }}>{t.total} <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 400 }}>{t.unidade}</span></span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{t.equipamentos.size} equip.</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabela detalhada */}
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Detalhamento ({rows.length} registro{rows.length !== 1 ? 's' : ''})</span>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Cliente', 'Contrato', 'Tipo', 'Modelo', 'Série', 'Código', 'Descrição', 'Qtd', 'Unid.', 'Data', 'OS'].map(h => (
                      <th key={h} style={{ background: 'var(--bg-3)', color: 'var(--text-2)', fontSize: 10, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 10px', textAlign: ['Qtd'].includes(h) ? 'center' : 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '8px 10px', fontSize: 12, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', fontWeight: 500 }}>{r.cliente}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', color: 'var(--text-2)' }}>{r.contrato}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', color: r.tipo === 'Locação' ? 'var(--orange-text)' : 'var(--blue-text)' }}>{r.tipo}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>{r.modelo}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', fontFamily: 'monospace', color: 'var(--text-2)' }}>{r.serie}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', fontFamily: 'monospace', color: 'var(--text-2)' }}>{r.codigo}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>{r.descricao}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'center', fontWeight: 600 }}>{r.qtd}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', color: 'var(--text-2)' }}>{r.unidade}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{r.data}</td>
                      <td style={{ padding: '8px 10px', fontSize: 11, borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none', fontFamily: 'monospace', color: 'var(--text-2)' }}>{r.os}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={11} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Nenhum registro encontrado para os filtros selecionados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
