import React, { useEffect, useState, useRef } from 'react'
import Nav from '../components/Nav'
import { supabase } from '../lib/supabase'

// ── jsPDF lazy import ─────────────────────────────────────────────────────────
async function getJsPDF() {
  const { jsPDF } = await import('jspdf')
  await import('jspdf-autotable')
  return jsPDF
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtData(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function fmtNumBR(n) {
  return (parseFloat(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtCNPJ(v) {
  const d = v.replace(/\D/g, '')
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return v
}

// ── Gerador de PDF ─────────────────────────────────────────────────────────────
async function gerarPDFRecibo(recibo, itens) {
  const jsPDF = await getJsPDF()
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = 210
  const ml = 15
  const mr = 15
  const contentW = pageW - ml - mr

  let y = 15

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(22, 27, 34) // --bg-2
  doc.rect(ml, y, contentW, 22, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(230, 237, 243)
  doc.text('GERA VALE KOMPRESSOREN', ml + 5, y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(139, 148, 158)
  doc.text('CNPJ: 19.090.416/0001-76', ml + 5, y + 15)
  doc.text('São José dos Campos — SP', ml + 5, y + 19.5)

  // Título à direita
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(230, 237, 243)
  doc.text('RECIBO DE ENTREGA', pageW - mr, y + 9, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(139, 148, 158)
  doc.text('DE PEÇAS E MATERIAIS', pageW - mr, y + 14, { align: 'right' })

  y += 28

  // ── Dados do documento ───────────────────────────────────────────────────────
  const col1 = ml
  const col2 = ml + 38
  const colMid = ml + contentW / 2 + 4
  const col3 = colMid + 38

  function linhaSimples(label, valor, cx1 = col1, cx2 = col2) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(label, cx1, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30)
    doc.setFontSize(9)
    doc.text(String(valor || '—'), cx2, y)
  }

  function linhaFull(label, valor) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(label, col1, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(30)
    const linhas = doc.splitTextToSize(String(valor || '—'), contentW - 38)
    doc.text(linhas, col2, y)
    y += 7 * (linhas.length - 1)
  }

  // Data + OS
  linhaSimples('Data de Entrega:', fmtData(recibo.data_entrega), col1, col2)
  linhaSimples('OS:', recibo.os || '____________', colMid, col3)
  y += 8

  // Linha divisória
  doc.setDrawColor(33, 38, 45)
  doc.setLineWidth(0.3)
  doc.line(ml, y, pageW - mr, y)
  y += 7

  // Cliente
  linhaFull('Cliente:', recibo.cliente_nome)
  y += 7
  if (recibo.cliente_cnpj) {
    linhaSimples('CNPJ:', fmtCNPJ(recibo.cliente_cnpj))
    y += 7
  }
  linhaFull('Endereço de entrega:', recibo.endereco)
  y += 7

  doc.line(ml, y, pageW - mr, y)
  y += 7

  // Equipamento
  linhaSimples('Equipamento:', recibo.equipamento_modelo)
  linhaSimples('Série:', recibo.equipamento_serie, colMid, col3)
  y += 10

  doc.line(ml, y, pageW - mr, y)
  y += 4

  // ── Tabela de itens ──────────────────────────────────────────────────────────
  doc.autoTable({
    startY: y,
    margin: { left: ml, right: mr },
    head: [['Código', 'Descrição', 'Qtd', 'Unidade']],
    body: itens.map(it => [
      it.codigo,
      it.descricao,
      fmtNumBR(it.quantidade),
      it.unidade,
    ]),
    styles: { fontSize: 9, cellPadding: 4, textColor: [30, 30, 30] },
    headStyles: { fillColor: [22, 27, 34], textColor: [139, 148, 158], fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 246, 248] },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
    },
    theme: 'plain',
  })

  y = doc.lastAutoTable.finalY + 16

  // ── Assinaturas ──────────────────────────────────────────────────────────────
  const assSep = (contentW - 20) / 2
  const x1 = ml + 10
  const x2 = ml + assSep + 20

  doc.setDrawColor(100)
  doc.setLineWidth(0.4)
  doc.line(x1, y, x1 + assSep - 10, y)
  doc.line(x2, y, x2 + assSep - 10, y)

  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text('Assinatura do Recebedor', x1 + (assSep - 10) / 2, y, { align: 'center' })
  doc.text('Responsável Gera Vale', x2 + (assSep - 10) / 2, y, { align: 'center' })

  y += 5
  doc.setFontSize(7)
  doc.text('Nome / Cargo:', x1, y)
  doc.text('Nome / Cargo:', x2, y)

  // ── Rodapé ───────────────────────────────────────────────────────────────────
  const pageH = 297
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.text('Documento gerado pelo sistema Gera Vale Kompressoren', pageW / 2, pageH - 8, { align: 'center' })
  doc.text(`Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, pageW / 2, pageH - 4, { align: 'center' })

  doc.save(`recibo_${recibo.cliente_nome.replace(/\s+/g, '_').slice(0, 20)}_${recibo.data_entrega}.pdf`)
}

// ── Form de item ───────────────────────────────────────────────────────────────
function ItemRow({ item, idx, total, onChange, onRemove }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 80px 32px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
      <input
        placeholder="Código"
        value={item.codigo}
        onChange={e => onChange(idx, 'codigo', e.target.value)}
        style={{ fontSize: 12 }}
      />
      <input
        placeholder="Descrição do material"
        value={item.descricao}
        onChange={e => onChange(idx, 'descricao', e.target.value)}
        style={{ fontSize: 12 }}
      />
      <input
        type="number"
        placeholder="Qtd"
        min="0"
        step="0.01"
        value={item.quantidade}
        onChange={e => onChange(idx, 'quantidade', e.target.value)}
        style={{ fontSize: 12 }}
      />
      <select
        value={item.unidade}
        onChange={e => onChange(idx, 'unidade', e.target.value)}
        style={{ fontSize: 12 }}
      >
        {['UN', 'PC', 'KG', 'L', 'M', 'CX', 'KIT', 'PAR'].map(u => <option key={u}>{u}</option>)}
      </select>
      <button
        onClick={() => onRemove(idx)}
        disabled={total <= 1}
        style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 5, color: 'var(--red-text)', cursor: total <= 1 ? 'not-allowed' : 'pointer', opacity: total <= 1 ? .3 : 1, fontSize: 13, padding: '2px 6px' }}
      >✕</button>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Recibo() {
  const [aba, setAba] = useState('novo') // 'novo' | 'historico'
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erroSalvar, setErroSalvar] = useState('')

  // Histórico
  const [recibos, setRecibos] = useState([])
  const [loadingHist, setLoadingHist] = useState(false)
  const [detalheId, setDetalheId] = useState(null)
  const [detalheItens, setDetalheItens] = useState([])
  const [gerandoPDF, setGerandoPDF] = useState(null)

  // Formulário
  const emptyForm = {
    data_entrega: new Date().toISOString().slice(0, 10),
    cliente_nome: '',
    cliente_cnpj: '',
    endereco: '',
    equipamento_modelo: '',
    equipamento_serie: '',
    os: '',
  }
  const emptyItem = { codigo: '', descricao: '', quantidade: '', unidade: 'UN' }

  const [form, setForm] = useState(emptyForm)
  const [itens, setItens] = useState([{ ...emptyItem }])

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function setItem(idx, k, v) {
    setItens(its => its.map((it, i) => i === idx ? { ...it, [k]: v } : it))
  }
  function addItem() { setItens(its => [...its, { ...emptyItem }]) }
  function removeItem(idx) { setItens(its => its.filter((_, i) => i !== idx)) }

  // ── Carregar histórico ──────────────────────────────────────────────────────
  async function carregarHistorico() {
    setLoadingHist(true)
    const { data } = await supabase.from('recibos').select('*').order('created_at', { ascending: false }).limit(50)
    setRecibos(data || [])
    setLoadingHist(false)
  }

  useEffect(() => { if (aba === 'historico') carregarHistorico() }, [aba])

  // ── Abrir detalhe ───────────────────────────────────────────────────────────
  async function abrirDetalhe(recibo) {
    setDetalheId(recibo.id)
    const { data } = await supabase.from('recibo_itens').select('*').eq('recibo_id', recibo.id).order('created_at')
    setDetalheItens(data || [])
  }

  // ── Salvar ──────────────────────────────────────────────────────────────────
  async function salvar() {
    // Validação
    if (!form.data_entrega || !form.cliente_nome.trim() || !form.endereco.trim() || !form.equipamento_modelo.trim() || !form.equipamento_serie.trim()) {
      setErroSalvar('Preencha todos os campos obrigatórios.')
      return
    }
    const itensValidos = itens.filter(it => it.codigo.trim() && it.descricao.trim() && parseFloat(it.quantidade) > 0)
    if (itensValidos.length === 0) {
      setErroSalvar('Adicione pelo menos um item com código, descrição e quantidade.')
      return
    }

    setSalvando(true)
    setErroSalvar('')

    try {
      const { data: user } = await supabase.auth.getUser()
      const { data: rec, error: errRec } = await supabase.from('recibos').insert({
        data_entrega: form.data_entrega,
        cliente_nome: form.cliente_nome.trim(),
        cliente_cnpj: form.cliente_cnpj.trim() || null,
        endereco: form.endereco.trim(),
        equipamento_modelo: form.equipamento_modelo.trim(),
        equipamento_serie: form.equipamento_serie.trim(),
        os: form.os.trim() || null,
        created_by: user?.user?.id || null,
      }).select().single()

      if (errRec) throw errRec

      const { error: errItens } = await supabase.from('recibo_itens').insert(
        itensValidos.map(it => ({
          recibo_id: rec.id,
          codigo: it.codigo.trim(),
          descricao: it.descricao.trim(),
          quantidade: parseFloat(it.quantidade),
          unidade: it.unidade,
        }))
      )
      if (errItens) throw errItens

      // Gerar PDF automaticamente
      await gerarPDFRecibo(rec, itensValidos.map(it => ({ ...it, quantidade: parseFloat(it.quantidade) })))

      // Reset
      setForm(emptyForm)
      setItens([{ ...emptyItem }])
      setSucesso(true)
      setTimeout(() => setSucesso(false), 4000)
    } catch (e) {
      setErroSalvar('Erro ao salvar: ' + (e.message || JSON.stringify(e)))
    } finally {
      setSalvando(false)
    }
  }

  // ── PDF a partir do histórico ───────────────────────────────────────────────
  async function baixarPDF(recibo) {
    setGerandoPDF(recibo.id)
    const { data: its } = await supabase.from('recibo_itens').select('*').eq('recibo_id', recibo.id).order('created_at')
    await gerarPDFRecibo(recibo, its || [])
    setGerandoPDF(null)
  }

  // ── UI helpers ──────────────────────────────────────────────────────────────
  const tabStyle = active => ({
    padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: active ? 600 : 400,
    cursor: 'pointer', background: active ? 'var(--bg-3)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text-2)', border: 'none',
  })

  const fieldStyle = { marginBottom: 16 }
  const labelStyle = { fontSize: 11, color: 'var(--text-2)', fontWeight: 500, marginBottom: 4, display: 'block' }
  const reqStyle = { color: 'var(--red-text)' }
  const halfGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }

  const reciboDetalhe = recibos.find(r => r.id === detalheId)

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav crumbs={[{ label: 'Recibo de Entrega' }]} />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 28px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Recibo de Entrega de Peças</h1>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>Gera recibo avulso + salva no histórico + download PDF para impressão</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
          <button style={tabStyle(aba === 'novo')} onClick={() => setAba('novo')}>Novo recibo</button>
          <button style={tabStyle(aba === 'historico')} onClick={() => setAba('historico')}>Histórico</button>
        </div>

        {/* ── NOVO RECIBO ─────────────────────────────────────────────────────── */}
        {aba === 'novo' && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>

            {sucesso && (
              <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--green-text)' }}>
                ✓ Recibo salvo com sucesso! O PDF foi gerado automaticamente.
              </div>
            )}

            {/* Data + OS */}
            <div style={halfGrid}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Data de entrega <span style={reqStyle}>*</span></label>
                <input type="date" value={form.data_entrega} onChange={e => setF('data_entrega', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>OS <span style={{ color: 'var(--text-3)', fontSize: 10 }}>(opcional — pode preencher à mão)</span></label>
                <input value={form.os} onChange={e => setF('os', e.target.value)} placeholder="Deixe em branco para preencher depois" />
              </div>
            </div>

            {/* Seção: Cliente */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 12, paddingTop: 4 }}>Cliente</div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Nome / Razão Social <span style={reqStyle}>*</span></label>
              <input value={form.cliente_nome} onChange={e => setF('cliente_nome', e.target.value)} placeholder="Nome completo ou razão social" />
            </div>
            <div style={halfGrid}>
              <div style={fieldStyle}>
                <label style={labelStyle}>CNPJ <span style={{ color: 'var(--text-3)', fontSize: 10 }}>(opcional)</span></label>
                <input value={form.cliente_cnpj} onChange={e => setF('cliente_cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div style={{ ...fieldStyle }}>
                {/* Espaço intencional */}
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Endereço de entrega <span style={reqStyle}>*</span></label>
              <input value={form.endereco} onChange={e => setF('endereco', e.target.value)} placeholder="Rua, número, complemento — cidade/UF" />
            </div>

            {/* Seção: Equipamento */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 12, paddingTop: 4 }}>Equipamento</div>

            <div style={halfGrid}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Modelo <span style={reqStyle}>*</span></label>
                <input value={form.equipamento_modelo} onChange={e => setF('equipamento_modelo', e.target.value)} placeholder="Ex.: Compressor Atlas Copco GA30" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Número de série <span style={reqStyle}>*</span></label>
                <input value={form.equipamento_serie} onChange={e => setF('equipamento_serie', e.target.value)} placeholder="Ex.: GXA123456" />
              </div>
            </div>

            {/* Seção: Peças */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10, paddingTop: 4 }}>Peças e materiais <span style={reqStyle}>*</span></div>

            {/* Header da tabela */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 80px 32px', gap: 6, marginBottom: 6 }}>
              {['Código', 'Descrição', 'Quantidade', 'Unidade', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '.04em', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>

            {itens.map((it, idx) => (
              <ItemRow key={idx} item={it} idx={idx} total={itens.length} onChange={setItem} onRemove={removeItem} />
            ))}

            <button onClick={addItem}
              style={{ marginTop: 6, background: 'none', border: '1px dashed var(--border-2)', borderRadius: 7, padding: '7px 14px', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', width: '100%' }}>
              + Adicionar peça
            </button>

            {/* Botão salvar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 10, alignItems: 'center' }}>
              {erroSalvar && <span style={{ fontSize: 11, color: 'var(--red-text)' }}>{erroSalvar}</span>}
              <button
                onClick={salvar}
                disabled={salvando}
                style={{
                  background: salvando ? 'var(--border-2)' : 'var(--blue)', color: '#fff',
                  border: 'none', borderRadius: 8, padding: '10px 24px',
                  fontSize: 13, fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {salvando ? '⏳ Salvando...' : '💾 Salvar e gerar PDF'}
              </button>
            </div>
          </div>
        )}

        {/* ── HISTÓRICO ────────────────────────────────────────────────────────── */}
        {aba === 'historico' && (
          <div>
            {detalheId && reciboDetalhe ? (
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                <button onClick={() => setDetalheId(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
                  ‹ Voltar ao histórico
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 600 }}>{reciboDetalhe.cliente_nome}</h2>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                      {fmtData(reciboDetalhe.data_entrega)} · {reciboDetalhe.equipamento_modelo} · Série: {reciboDetalhe.equipamento_serie}
                    </div>
                    {reciboDetalhe.cliente_cnpj && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>CNPJ: {fmtCNPJ(reciboDetalhe.cliente_cnpj)}</div>}
                    {reciboDetalhe.endereco && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{reciboDetalhe.endereco}</div>}
                  </div>
                  <button
                    onClick={() => baixarPDF(reciboDetalhe)}
                    disabled={gerandoPDF === reciboDetalhe.id}
                    style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                    {gerandoPDF === reciboDetalhe.id ? '⏳ Gerando...' : '⬇ Baixar PDF'}
                  </button>
                </div>

                {/* Tabela de itens */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-3)' }}>
                        {['Código', 'Descrição', 'Quantidade', 'Unidade'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', fontSize: 10, fontWeight: 600, color: 'var(--text-2)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detalheItens.map((it, i) => (
                        <tr key={it.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '9px 12px', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>{it.codigo}</td>
                          <td style={{ padding: '9px 12px', fontSize: 12 }}>{it.descricao}</td>
                          <td style={{ padding: '9px 12px', fontSize: 12, textAlign: 'right' }}>{fmtNumBR(it.quantidade)}</td>
                          <td style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text-2)' }}>{it.unidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div>
                {loadingHist ? (
                  <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-2)', fontSize: 12 }}>Carregando...</div>
                ) : recibos.length === 0 ? (
                  <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Nenhum recibo emitido ainda.</div>
                ) : (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    {recibos.map((rec, i) => (
                      <div
                        key={rec.id}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < recibos.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-2)', cursor: 'pointer', transition: 'background .1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-2)'}
                        onClick={() => abrirDetalhe(rec)}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{rec.cliente_nome}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>
                            {fmtData(rec.data_entrega)} · {rec.equipamento_modelo} · Série {rec.equipamento_serie}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <button
                            onClick={e => { e.stopPropagation(); baixarPDF(rec) }}
                            disabled={gerandoPDF === rec.id}
                            style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 6, color: 'var(--text-2)', padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                            {gerandoPDF === rec.id ? '⏳' : '⬇ PDF'}
                          </button>
                          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>›</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
