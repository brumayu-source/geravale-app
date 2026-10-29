import React, { useState } from 'react'
import Nav from '../components/Nav'

// ── Dados dos CFOPs da Gera Vale ──────────────────────────────────────────────
const CFOPS = [
  {
    codigo: '5102',
    natureza: 'Venda de mercadoria adquirida ou recebida de terceiros',
    categoria: 'pecas',
    catLabel: 'Peças / Filtros',
    cor: '#7C3AED',
    quando: 'Venda de filtros e peças Kaeser para clientes dentro de SP.',
    naoConfundir: 'Não usar 5405 — este CFOP (5405) é exclusivo para produtos com Substituição Tributária. Os filtros (NCM 8421) não têm ST.',
    pares: [],
    cst: '200 (origem 2, tributado normalmente)',
    ncm: '8421.99.10 / 8421.99.99',
    icms: 'Alíquota SP (12%) — sem ICMS-ST',
    obs: 'Filtros e separadores Kaeser são de origem estrangeira (orig 2) → alíquota interestadual 4% quando fora de SP.',
  },
  {
    codigo: '5117',
    natureza: 'Venda de mercadoria adquirida ou recebida de terceiros — entrega futura em SP',
    categoria: 'oleo',
    catLabel: 'Óleo',
    cor: '#F97316',
    quando: 'Faturamento de óleo para cliente em SP com entrega parcelada — nota de faturamento total.',
    naoConfundir: 'Diferente de 5405 (venda normal com ST) e 6117 (interestadual). O 5117 é o faturamento; o 5116 é a remessa complementar dentro de SP.',
    pares: [{ codigo: '5116', descricao: 'Remessa complementar dentro de SP (entrega futura)' }],
    cst: '041 (monofásico — não incidência)',
    ncm: '3403.99.00',
    icms: 'R$ 0,00 — monofásico',
    obs: 'Para faturamento de óleo com entrega futura dentro de SP. Menos comum que 5405 no dia a dia.',
  },
  {
    codigo: '5405',
    natureza: 'Venda de mercadoria, adquirida ou recebida de terceiros, sujeita ao regime de substituição tributária',
    categoria: 'oleo',
    catLabel: 'Óleo',
    cor: '#F97316',
    quando: 'Venda de óleo lubrificante ANS460 para cliente dentro de SP.',
    naoConfundir: 'Não usar 6403 — o 6403 é interestadual. Não usar 5102 — o 5102 é para produtos sem ST.',
    pares: [],
    cst: '060 (ST recolhida anteriormente)',
    ncm: '3403.99.00',
    icms: 'R$ 0,00 — ICMS-ST já recolhido na entrada da mercadoria',
    obs: 'O óleo entra com ST já paga. Ao vender dentro de SP, o ICMS é zero (CST 060). Sem nova ST.',
  },
  {
    codigo: '5915',
    natureza: 'Remessa de bem ou mercadoria recebida para conserto ou reparo',
    categoria: 'conserto',
    catLabel: 'Conserto',
    cor: '#F59E0B',
    quando: 'Emissão da nota quando o cliente manda um equipamento para a Gera Vale consertar — dentro de SP.',
    naoConfundir: 'Não confundir com 5916 (retorno). O par é 5915 (remessa) + 5916 (retorno). Fora de SP: 6915.',
    pares: [{ codigo: '5916', descricao: 'Retorno do bem após conserto — SP' }],
    cst: '041 (não incidência — conserto não é venda)',
    ncm: 'NCM do equipamento do cliente',
    icms: 'R$ 0,00 — não é venda',
    obs: 'O equipamento pertence ao cliente — sem fato gerador de ICMS. No Omie: produto SCRKR, estoque E.MOV, sem conta a pagar/receber.',
  },
  {
    codigo: '5916',
    natureza: 'Retorno de bem ou mercadoria recebida para conserto ou reparo',
    categoria: 'conserto',
    catLabel: 'Conserto',
    cor: '#F59E0B',
    quando: 'Devolução do equipamento após o conserto ao cliente em SP.',
    naoConfundir: 'Não confundir com 5915 (remessa). O retorno só existe se já houve uma remessa. Fora de SP: 6916.',
    pares: [{ codigo: '5915', descricao: 'Remessa do bem para conserto — SP' }],
    cst: '041',
    ncm: 'Mesmo NCM da remessa',
    icms: 'R$ 0,00',
    obs: 'Itens, quantidades e valores devem ser iguais à nota de remessa (5915). Referenciar a nota de remessa via NFref.',
  },
  {
    codigo: '6102',
    natureza: 'Venda de mercadoria adquirida ou recebida de terceiros — interestadual',
    categoria: 'pecas',
    catLabel: 'Peças / Filtros',
    cor: '#7C3AED',
    quando: 'Venda de filtros e peças Kaeser para clientes fora de SP.',
    naoConfundir: 'Não usar 6403 — o 6403 é para produtos com ST. Filtros (8421) não têm ST.',
    pares: [],
    cst: '200 (origem 2)',
    ncm: '8421.99.10 / 8421.99.99',
    icms: '4% (interestadual, produto de origem estrangeira orig 2)',
    obs: 'ICMS-ST = R$ 0,00 para NCM 8421. Produto de importação: origem 2. Alíquota interestadual 4%.',
  },
  {
    codigo: '6117',
    natureza: 'Venda de mercadoria adquirida ou recebida de terceiros — entrega futura interestadual',
    categoria: 'oleo',
    catLabel: 'Óleo',
    cor: '#0D9488',
    quando: 'Remessa complementar de óleo para cliente fora de SP — entrega de saldo de nota anterior.',
    naoConfundir: 'Diferente de 6403 (venda normal interestadual com ST). O 6117 é a remessa futura; o ICMS foi recolhido na nota de faturamento original. Nunca usar 6117 para faturamento novo.',
    pares: [],
    cst: '041 (não incidência — imposto recolhido na origem)',
    ncm: '3403.99.00',
    icms: 'R$ 0,00 — ICMS já recolhido na NF de faturamento original',
    obs: 'Obrigatório referenciar a NF de faturamento original no campo NFref. Fundamento: Art. 7º, XIV, RICMS/SP.',
  },
  {
    codigo: '6403',
    natureza: 'Venda de mercadoria sujeita a ST — interestadual',
    categoria: 'oleo',
    catLabel: 'Óleo',
    cor: '#F97316',
    quando: 'Venda de óleo lubrificante ANS460 para clientes fora de SP (PE, ES, outros estados).',
    naoConfundir: 'Não usar 5405 — o 5405 é dentro de SP. Não usar 6102 — o 6102 é para produtos sem ST.',
    pares: [],
    cst: 'Varia: 020 ou similar (interestadual com ST)',
    ncm: '3403.99.00',
    icms: '4% interestadual (origem 2) + ICMS-ST conforme protocolo de cada estado',
    obs: 'PE e ES têm protocolo com SP — emitir GNRE antes da saída. Outros estados: verificar com o fiscal se há protocolo.',
  },
  {
    codigo: '6915',
    natureza: 'Remessa de bem ou mercadoria recebida para conserto ou reparo — interestadual',
    categoria: 'conserto',
    catLabel: 'Conserto',
    cor: '#F59E0B',
    quando: 'Equipamento de cliente de outro estado sendo enviado para a Gera Vale consertar.',
    naoConfundir: 'Versão interestadual do 5915. Usar quando o cliente está fora de SP.',
    pares: [{ codigo: '6916', descricao: 'Retorno do bem após conserto — interestadual' }],
    cst: '041',
    ncm: 'NCM do equipamento',
    icms: 'R$ 0,00',
    obs: 'Mesmo tratamento do 5915, porém para operações interestaduais. Sem ICMS em nenhum dos dois.',
  },
  {
    codigo: '6916',
    natureza: 'Retorno de bem ou mercadoria recebida para conserto ou reparo — interestadual',
    categoria: 'conserto',
    catLabel: 'Conserto',
    cor: '#F59E0B',
    quando: 'Devolução do equipamento consertado para cliente de outro estado.',
    naoConfundir: 'Par do 6915. Versão interestadual do 5916.',
    pares: [{ codigo: '6915', descricao: 'Remessa para conserto — interestadual' }],
    cst: '041',
    ncm: 'Mesmo NCM da remessa',
    icms: 'R$ 0,00',
    obs: 'Referenciar a nota de remessa 6915 via NFref.',
  },
]

const CATEGORIAS = [
  { id: 'todos', label: 'Todos', cor: 'var(--text-3)' },
  { id: 'oleo',    label: '🛢️ Óleo',    cor: '#F97316' },
  { id: 'pecas',   label: '🔩 Peças',   cor: '#7C3AED' },
  { id: 'conserto',label: '📦 Conserto', cor: '#F59E0B' },
]

// ── Card de CFOP ─────────────────────────────────────────────────────────────
function CFOPCard({ c }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div style={{
      border: `1px solid ${aberto ? c.cor : 'var(--border)'}`,
      borderLeft: `4px solid ${c.cor}`,
      borderRadius: 10, overflow: 'hidden', background: '#fff',
      boxShadow: aberto ? '0 2px 8px rgba(0,0,0,.07)' : 'none',
      transition: 'box-shadow .15s, border-color .15s',
    }}>
      {/* Cabeçalho clicável */}
      <button
        onClick={() => setAberto(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        {/* Código */}
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: 18, fontWeight: 700, color: c.cor,
          minWidth: 60, flexShrink: 0, lineHeight: 1,
        }}>
          {c.codigo}
        </div>

        {/* Descrição */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>{c.natureza}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
            <span style={{
              display: 'inline-block', padding: '1px 7px', borderRadius: 10,
              background: `color-mix(in srgb, ${c.cor} 12%, white)`,
              color: c.cor, fontWeight: 600,
            }}>{c.catLabel}</span>
          </div>
        </div>

        {/* Seta */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transition: 'transform .15s', transform: aberto ? 'rotate(180deg)' : '' }}>
          <path d="M4 6l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Detalhe expandido */}
      {aberto && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, paddingTop: 14 }}>

            {/* Quando usar */}
            <div style={{ padding: '10px 12px', background: 'var(--green-bg)', borderRadius: 8, border: '1px solid #86EFAC' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--green-text)', marginBottom: 4 }}>✅ Quando usar</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{c.quando}</div>
            </div>

            {/* Não confundir */}
            <div style={{ padding: '10px 12px', background: 'var(--red-bg)', borderRadius: 8, border: '1px solid #FCA5A5' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--red-text)', marginBottom: 4 }}>❌ Não confundir</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{c.naoConfundir}</div>
            </div>

          </div>

          {/* Tabela de campos */}
          <div style={{ marginTop: 10, background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {[
              { label: 'CST ICMS', valor: c.cst },
              { label: 'NCM', valor: c.ncm },
              { label: 'ICMS', valor: c.icms },
            ].map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 12px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-3)', minWidth: 70, flexShrink: 0, paddingTop: 2 }}>{row.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'DM Mono, monospace', lineHeight: 1.5 }}>{row.valor}</span>
              </div>
            ))}
          </div>

          {/* Pares operacionais */}
          {c.pares.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-3)', marginBottom: 6 }}>Par operacional</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {c.pares.map((par, pi) => (
                  <div key={pi} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                    background: `color-mix(in srgb, ${c.cor} 10%, white)`,
                    border: `1px solid color-mix(in srgb, ${c.cor} 25%, #e5e7eb)`,
                    borderRadius: 8,
                  }}>
                    <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 14, color: c.cor }}>{par.codigo}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{par.descricao}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Obs */}
          {c.obs && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--yellow-bg)', borderRadius: 8, border: '1px solid #FDE68A', fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700 }}>💡 </span>{c.obs}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function CFOP() {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')

  const lista = CFOPS.filter(c => {
    const matchCat = filtro === 'todos' || c.categoria === filtro
    const q = busca.toLowerCase()
    const matchBusca = !q || c.codigo.includes(q) || c.natureza.toLowerCase().includes(q) || c.quando.toLowerCase().includes(q)
    return matchCat && matchBusca
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)' }}>
      <Nav />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Cabeçalho */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>CFOPs da Gera Vale</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '6px 0 0' }}>
            Todos os CFOPs utilizados nas operações fiscais da Gera Vale — quando usar, o que não confundir e os pares operacionais.
          </p>
        </div>

        {/* Filtros + busca */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIAS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFiltro(cat.id)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${filtro === cat.id ? cat.cor : 'var(--border)'}`,
                  background: filtro === cat.id ? `color-mix(in srgb, ${cat.cor} 12%, white)` : '#fff',
                  color: filtro === cat.id ? cat.cor : 'var(--text-2)',
                  transition: 'all .12s',
                }}
              >{cat.label}</button>
            ))}
          </div>
          <input
            placeholder="Buscar por código ou palavra…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{
              marginLeft: 'auto', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
              fontSize: 13, color: 'var(--text)', background: '#fff', outline: 'none', minWidth: 200,
            }}
          />
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lista.length > 0 ? lista.map(c => <CFOPCard key={c.codigo} c={c} />) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              Nenhum CFOP encontrado com esses critérios.
            </div>
          )}
        </div>

        {/* Tabela resumo */}
        <div style={{ marginTop: 32, padding: '16px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-3)', marginBottom: 12 }}>
            Resumo — Pares operacionais
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {[
              { par: '5405', desc: 'Venda óleo SP', cor: '#F97316' },
              { par: '6403', desc: 'Venda óleo fora SP', cor: '#F97316' },
              { par: '6117', desc: 'Remessa futura óleo', cor: '#0D9488' },
              { par: '5915 + 5916', desc: 'Conserto SP (remessa + retorno)', cor: '#F59E0B' },
              { par: '6915 + 6916', desc: 'Conserto interestadual', cor: '#F59E0B' },
              { par: '5102 / 6102', desc: 'Peças SP / outro estado', cor: '#7C3AED' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                background: `color-mix(in srgb, ${item.cor} 8%, white)`,
                border: `1px solid color-mix(in srgb, ${item.cor} 20%, #e5e7eb)`,
                borderRadius: 8,
              }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 13, color: item.cor, minWidth: 80, flexShrink: 0 }}>{item.par}</span>
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
