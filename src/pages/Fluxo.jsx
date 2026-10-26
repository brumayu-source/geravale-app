import React, { useState } from 'react'
import Nav from '../components/Nav'

// ── Árvore de decisão ─────────────────────────────────────────────────────────
// Cada nó: { id, pergunta, opcoes: [{label, prox}] } ou { id, resultado: {...} }

const ARVORE = {
  inicio: {
    id: 'inicio',
    pergunta: 'O que você está emitindo?',
    opcoes: [
      { label: '🔧 Nota de serviço (manutenção)', prox: 'servico_local' },
      { label: '🛢 Nota de produto — óleo lubrificante', prox: 'oleo_uf' },
      { label: '🔩 Par de notas — conserto fora da planta', prox: 'conserto_uf' },
    ]
  },

  // ── SERVIÇO ──────────────────────────────────────────────────────────────────
  servico_local: {
    id: 'servico_local',
    pergunta: 'Onde o serviço foi prestado?',
    opcoes: [
      { label: 'No cliente (técnico foi ao local)', prox: 'servico_ctribNac' },
      { label: 'Na oficina da Gera Vale', prox: 'servico_oficina' },
    ]
  },
  servico_oficina: {
    id: 'servico_oficina',
    pergunta: 'O serviço incluiu fornecimento de óleo?',
    opcoes: [
      { label: 'Não — só serviço', prox: 'servico_ctribNac_oficina' },
      { label: 'Sim — serviço + óleo', prox: 'servico_ctribNac_oleo' },
    ]
  },
  servico_ctribNac: {
    id: 'servico_ctribNac',
    pergunta: 'O serviço incluiu fornecimento de óleo?',
    opcoes: [
      { label: 'Não — só serviço', prox: 'res_nfse_050102' },
      { label: 'Sim — serviço + óleo (cobrado na mesma nota)', prox: 'res_nfse_100301' },
    ]
  },
  servico_ctribNac_oficina: { id: 'servico_ctribNac_oficina', prox_direto: 'res_nfse_050101' },
  servico_ctribNac_oleo: { id: 'servico_ctribNac_oleo', prox_direto: 'res_nfse_100301_oficina' },

  // ── ÓLEO ─────────────────────────────────────────────────────────────────────
  oleo_uf: {
    id: 'oleo_uf',
    pergunta: 'Qual o estado de destino do cliente?',
    opcoes: [
      { label: 'São Paulo (SP)', prox: 'res_oleo_sp' },
      { label: 'Pernambuco (PE)', prox: 'res_oleo_pe' },
      { label: 'Espírito Santo (ES)', prox: 'res_oleo_es' },
      { label: 'Outro estado', prox: 'res_oleo_outro' },
    ]
  },

  // ── CONSERTO ─────────────────────────────────────────────────────────────────
  conserto_uf: {
    id: 'conserto_uf',
    pergunta: 'O cliente é de SP ou de outro estado?',
    opcoes: [
      { label: 'Cliente em SP', prox: 'res_conserto_sp' },
      { label: 'Cliente em outro estado', prox: 'res_conserto_inter' },
    ]
  },
}

// ── Resultados ────────────────────────────────────────────────────────────────
const RESULTADOS = {
  res_nfse_050102: {
    titulo: 'NFS-e — Serviço no cliente',
    cor: 'var(--blue)',
    icone: '📋',
    campos: [
      { label: 'Tipo de nota', valor: 'NFS-e Nacional' },
      { label: 'cTribNac', valor: '140101', desc: 'Conservação e manutenção de máquinas' },
      { label: 'cTribMun', valor: '0068', desc: 'Manutenção e conservação — SJC' },
      { label: 'cIndOp', valor: '050102', desc: 'Serviço prestado no estabelecimento do tomador' },
      { label: 'cLocPrestacao', valor: '3549904', desc: 'IBGE São José dos Campos' },
      { label: 'cNBS', valor: 'informar conforme serviço' },
      { label: 'ISS', valor: '3%', desc: 'Alíquota municipal SJC' },
      { label: 'PIS/COFINS CST', valor: '01', desc: 'Tributado à alíquota básica' },
      { label: 'Retenção PIS/COFINS', valor: '4,65%', desc: 'tpRetPisCofins = 3 (retido pelo tomador)' },
    ],
    obs: 'Emita a NFS-e pelo sistema da prefeitura de SJC. Verifique se o contrato prevê retenção de ISS pelo tomador (tpRetISSQN = 1).'
  },
  res_nfse_050101: {
    titulo: 'NFS-e — Serviço na oficina',
    cor: 'var(--blue)',
    icone: '📋',
    campos: [
      { label: 'Tipo de nota', valor: 'NFS-e Nacional' },
      { label: 'cTribNac', valor: '140101', desc: 'Conservação e manutenção de máquinas' },
      { label: 'cTribMun', valor: '0068', desc: 'Manutenção e conservação — SJC' },
      { label: 'cIndOp', valor: '050101', desc: 'Serviço prestado no estabelecimento do prestador' },
      { label: 'cLocPrestacao', valor: '3549904', desc: 'IBGE São José dos Campos' },
      { label: 'ISS', valor: '3%' },
      { label: 'PIS/COFINS CST', valor: '01' },
      { label: 'Retenção PIS/COFINS', valor: '4,65%', desc: 'tpRetPisCofins = 3' },
    ],
    obs: 'O serviço foi realizado na oficina da Gera Vale. Use cIndOp 050101.'
  },
  res_nfse_100301: {
    titulo: 'NFS-e — Serviço + óleo (no cliente)',
    cor: 'var(--blue)',
    icone: '📋',
    campos: [
      { label: 'Tipo de nota', valor: 'NFS-e Nacional' },
      { label: 'cTribNac', valor: '100901', desc: 'Serviço com fornecimento de mercadoria' },
      { label: 'cTribMun', valor: '0068' },
      { label: 'cIndOp', valor: '100301', desc: 'Fornecimento de mercadoria com prestação de serviço' },
      { label: 'cLocPrestacao', valor: '3549904' },
      { label: 'ISS', valor: '3%' },
      { label: 'PIS/COFINS CST', valor: '01' },
      { label: 'Retenção PIS/COFINS', valor: '4,65%', desc: 'tpRetPisCofins = 3' },
    ],
    obs: 'O óleo foi cobrado junto ao serviço na mesma NFS-e. Para óleo cobrado separado via NF-e de produto, emita também a nota de produto (veja o fluxo de óleo).'
  },
  res_nfse_100301_oficina: {
    titulo: 'NFS-e — Serviço + óleo (na oficina)',
    cor: 'var(--blue)',
    icone: '📋',
    campos: [
      { label: 'Tipo de nota', valor: 'NFS-e Nacional' },
      { label: 'cTribNac', valor: '100901' },
      { label: 'cTribMun', valor: '0068' },
      { label: 'cIndOp', valor: '100301' },
      { label: 'cLocPrestacao', valor: '3549904' },
      { label: 'ISS', valor: '3%' },
      { label: 'PIS/COFINS CST', valor: '01' },
      { label: 'Retenção', valor: '4,65%' },
    ],
    obs: ''
  },
  res_oleo_sp: {
    titulo: 'NF-e — Óleo (destinatário SP)',
    cor: 'var(--orange)',
    icone: '🛢',
    campos: [
      { label: 'Tipo de nota', valor: 'NF-e (produto)' },
      { label: 'CFOP', valor: '5.405', desc: 'Venda dentro do estado de SP' },
      { label: 'NCM', valor: '3403.99.00' },
      { label: 'CEST', valor: '06.017.00' },
      { label: 'Origem', valor: '2', desc: 'Estrangeiro — de procedência conhecida' },
      { label: 'ICMS alíquota', valor: '4%', desc: 'Alíquota interestadual para importados' },
      { label: 'ICMS-ST', valor: '18% (SP)', desc: 'Alíquota interna de SP' },
      { label: 'Base PIS/COFINS', valor: 'vProd − ICMS próprio' },
      { label: 'PIS', valor: '1,65%', desc: 'CST 01 — regime não-cumulativo' },
      { label: 'COFINS', valor: '7,6%', desc: 'CST 01 — regime não-cumulativo' },
    ],
    obs: 'A base de PIS/COFINS deve ser o valor do produto menos o ICMS próprio. Não inclua o ICMS-ST na base.'
  },
  res_oleo_pe: {
    titulo: 'NF-e — Óleo (destinatário PE)',
    cor: 'var(--orange)',
    icone: '🛢',
    campos: [
      { label: 'Tipo de nota', valor: 'NF-e (produto)' },
      { label: 'CFOP', valor: '6.403', desc: 'Venda interestadual com ST' },
      { label: 'NCM', valor: '3403.99.00' },
      { label: 'CEST', valor: '06.017.00' },
      { label: 'Origem', valor: '2' },
      { label: 'ICMS alíquota', valor: '4%', desc: 'Interestadual — produto importado' },
      { label: 'ICMS-ST', valor: '20,5% (PE)' },
      { label: 'Base PIS/COFINS', valor: 'vProd − ICMS próprio' },
      { label: 'PIS', valor: '1,65%' },
      { label: 'COFINS', valor: '7,6%' },
    ],
    obs: 'ICMS-ST para Pernambuco: 20,5%. Verifique convênio ICMS vigente antes de emitir.'
  },
  res_oleo_es: {
    titulo: 'NF-e — Óleo (destinatário ES)',
    cor: 'var(--orange)',
    icone: '🛢',
    campos: [
      { label: 'Tipo de nota', valor: 'NF-e (produto)' },
      { label: 'CFOP', valor: '6.403', desc: 'Venda interestadual com ST' },
      { label: 'NCM', valor: '3403.99.00' },
      { label: 'CEST', valor: '06.017.00' },
      { label: 'Origem', valor: '2' },
      { label: 'ICMS alíquota', valor: '4%' },
      { label: 'ICMS-ST', valor: '17% (ES)' },
      { label: 'Base PIS/COFINS', valor: 'vProd − ICMS próprio' },
      { label: 'PIS', valor: '1,65%' },
      { label: 'COFINS', valor: '7,6%' },
    ],
    obs: 'ICMS-ST para Espírito Santo: 17%.'
  },
  res_oleo_outro: {
    titulo: 'NF-e — Óleo (outro estado)',
    cor: 'var(--orange)',
    icone: '🛢',
    campos: [
      { label: 'Tipo de nota', valor: 'NF-e (produto)' },
      { label: 'CFOP', valor: '6.403', desc: 'Venda interestadual com ST' },
      { label: 'NCM', valor: '3403.99.00' },
      { label: 'CEST', valor: '06.017.00' },
      { label: 'Origem', valor: '2' },
      { label: 'ICMS alíquota', valor: '4%' },
      { label: 'ICMS-ST', valor: 'consultar para o estado', desc: '⚠ Verificar convênio ICMS vigente' },
      { label: 'PIS', valor: '1,65%' },
      { label: 'COFINS', valor: '7,6%' },
    ],
    obs: '⚠ Para estados não listados, consulte o convênio ICMS vigente para óleo lubrificante (NCM 3403.99.00). A ST pode não se aplicar em todos os estados.'
  },
  res_conserto_sp: {
    titulo: 'Par de NF-e — Conserto (dentro de SP)',
    cor: '#A78BFA',
    icone: '🔩',
    campos: [
      { label: 'NF-e de remessa', valor: 'CFOP 5.915', desc: 'Remessa para conserto — dentro do estado' },
      { label: 'NF-e de retorno', valor: 'CFOP 5.916', desc: 'Retorno de conserto — dentro do estado' },
      { label: 'ICMS', valor: 'Não tributado (ST suspensa)' },
      { label: 'PIS/COFINS', valor: 'CST 07', desc: 'Não tributado — remessa para conserto' },
      { label: 'Série', valor: 'mesma em ambas as notas' },
    ],
    obs: 'Os itens e valores devem ser idênticos nas duas notas. O par forma um ciclo: a NF-e de retorno é casada com a de remessa no sistema do cliente.',
    dupla: true
  },
  res_conserto_inter: {
    titulo: 'Par de NF-e — Conserto (interestadual)',
    cor: '#A78BFA',
    icone: '🔩',
    campos: [
      { label: 'NF-e de remessa', valor: 'CFOP 6.915', desc: 'Remessa para conserto — interestadual' },
      { label: 'NF-e de retorno', valor: 'CFOP 6.916', desc: 'Retorno de conserto — interestadual' },
      { label: 'ICMS', valor: 'Não tributado' },
      { label: 'PIS/COFINS', valor: 'CST 07' },
      { label: 'Série', valor: 'mesma em ambas as notas' },
    ],
    obs: 'Use 6.915 / 6.916 quando o cliente está em outro estado. Itens e valores devem ser idênticos nas duas notas.',
    dupla: true
  },
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function Fluxo() {
  const [historico, setHistorico] = useState(['inicio'])
  const [resultadoId, setResultadoId] = useState(null)

  const noAtual = historico[historico.length - 1]
  const no = ARVORE[noAtual]
  const resultado = resultadoId ? RESULTADOS[resultadoId] : null

  function escolher(prox) {
    const proxNo = ARVORE[prox]
    if (!proxNo) {
      // É um resultado
      setResultadoId(prox)
    } else if (proxNo.prox_direto) {
      // Nó transparente — vai direto para o resultado
      setResultadoId(proxNo.prox_direto)
    } else {
      setHistorico(h => [...h, prox])
    }
  }

  function reiniciar() {
    setHistorico(['inicio'])
    setResultadoId(null)
  }

  function voltar() {
    if (resultadoId) {
      setResultadoId(null)
      return
    }
    if (historico.length > 1) {
      setHistorico(h => h.slice(0, -1))
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav crumbs={[{ label: 'Fluxo Interativo' }]} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 28px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Fluxo Interativo</h1>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
            Responda as perguntas e descubra o CFOP, CST, cIndOp e alíquotas corretas para o caso
          </p>
        </div>

        {/* Breadcrumb do fluxo */}
        {historico.length > 1 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 20 }}>
            {historico.map((nId, i) => (
              <React.Fragment key={nId}>
                {i > 0 && <span style={{ color: 'var(--text-3)', fontSize: 11 }}>›</span>}
                <span style={{ fontSize: 11, color: i === historico.length - 1 ? 'var(--text)' : 'var(--text-3)' }}>
                  {ARVORE[nId]?.pergunta?.slice(0, 30) || '?'}…
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div style={{ background: 'var(--bg-2)', border: `1px solid ${resultado.cor}40`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 22 }}>{resultado.icone}</span>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: resultado.cor }}>{resultado.titulo}</h2>
                {resultado.dupla && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Requer emissão de 2 NF-e</span>}
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              {resultado.campos.map((c, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, padding: '9px 14px', background: i % 2 === 0 ? 'var(--bg-3)' : 'var(--bg-2)', borderBottom: i < resultado.campos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, letterSpacing: '.03em' }}>{c.label}</span>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'DM Mono, monospace' }}>{c.valor}</span>
                    {c.desc && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>— {c.desc}</span>}
                  </div>
                </div>
              ))}
            </div>

            {resultado.obs && (
              <div style={{ background: 'var(--bg-3)', borderRadius: 7, padding: '10px 14px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                💡 {resultado.obs}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={reiniciar}
                style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                Nova consulta
              </button>
              <button onClick={voltar}
                style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 7, padding: '8px 14px', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
                ‹ Voltar
              </button>
            </div>
          </div>
        )}

        {/* Pergunta */}
        {!resultado && no && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 24, lineHeight: 1.4 }}>{no.pergunta}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {no.opcoes.map(op => (
                <button
                  key={op.prox}
                  onClick={() => escolher(op.prox)}
                  style={{
                    background: 'var(--bg-3)', border: '1px solid var(--border-2)',
                    borderRadius: 9, padding: '13px 18px', textAlign: 'left',
                    fontSize: 13, color: 'var(--text)', cursor: 'pointer',
                    transition: 'border-color .15s, background .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--bg-2)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {historico.length > 1 && (
              <button onClick={voltar}
                style={{ marginTop: 20, background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                ‹ Voltar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
