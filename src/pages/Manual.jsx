import React, { useState } from 'react'
import Nav from '../components/Nav'

// ── Conteúdo do Manual Fiscal Gera Vale ──────────────────────────────────────
const MANUAL = [
  {
    id: 'parte1',
    titulo: 'Parte 1 — Estrutura das Operações',
    icon: '🏗',
    secoes: [
      {
        id: 'p1-visao',
        titulo: '1.1 Visão Geral das Operações',
        conteudo: `A Gera Vale Kompressoren realiza dois tipos principais de operação com seus clientes:

**Manutenção (serviço)** — Prestação de serviço de manutenção preventiva e/ou corretiva em compressores e equipamentos industriais. A Gera Vale emite NFS-e (Nota Fiscal de Serviço Eletrônica) para cobrar pelos serviços prestados.

**Óleo lubrificante** — Venda e troca de óleo de compressores. Como há produto físico envolvido, a Gera Vale emite NF-e (Nota Fiscal Eletrônica de produto), com CFOP e NCM específicos para óleos lubrificantes.

**Conserto (remessa + retorno)** — Quando o equipamento ou componente precisa ser retirado das instalações do cliente para reparo na oficina da Gera Vale, são necessárias duas NF-e: uma de remessa para conserto e outra de retorno, formando um par.`
      },
      {
        id: 'p1-cnpj',
        titulo: '1.2 CNPJ e Dados da Gera Vale',
        conteudo: `**Razão social:** Gera Vale Kompressoren Serviços Ltda
**CNPJ:** 19.090.416/0001-76
**Município:** São José dos Campos — SP
**Código IBGE SJC:** 3549904

O CNPJ deve ser verificado em todas as notas emitidas pela Gera Vale como prestador (NFS-e) ou emitente (NF-e). Qualquer divergência indica erro de cadastro no sistema do cliente ou na emissão.`
      },
      {
        id: 'p1-regimes',
        titulo: '1.3 Regimes e Obrigações',
        conteudo: `A Gera Vale está sujeita a:

**ISS (Imposto Sobre Serviços)** — Tributo municipal incidente sobre a NFS-e de serviço. Alíquota: 3%.

**PIS e COFINS** — Contribuições federais incidentes tanto na NFS-e quanto na NF-e. A regra geral para serviços prestados a pessoas jurídicas prevê retenção na fonte de 4,65% (PIS 0,65% + COFINS 3% + CSLL 1%).

**ICMS** — Imposto estadual incidente na NF-e de produto (óleo). Para operações com produtos importados (origem 2), a alíquota interestadual pode ser 4%.

**ICMS-ST (Substituição Tributária)** — Para óleo lubrificante em determinados estados, o ICMS é recolhido antecipadamente pelo substituto tributário. As alíquotas de ST variam por UF de destino.`
      }
    ]
  },
  {
    id: 'parte2',
    titulo: 'Parte 2 — Notas Fiscais em Detalhe',
    icon: '📄',
    secoes: [
      {
        id: 'p2-nfse',
        titulo: '2.1 NFS-e — Nota Fiscal de Serviço',
        conteudo: `A NFS-e é emitida pela Gera Vale para cobrar pelos serviços de manutenção.

**Campos obrigatórios a conferir:**

| Campo | Valor esperado | Observação |
|-------|---------------|------------|
| cTribNac | 140101 | Serviços de conservação/manutenção de máquinas |
| cTribNac | 100901 | Quando o serviço inclui fornecimento de óleo |
| cTribMun | 0068 | Código municipal SJC: manutenção e conservação |
| cIndOp | 050101–050104 ou 100301 | Indicador de operação — ver tabela 2.2 |
| cLocPrestacao | 3549904 | IBGE de São José dos Campos |
| pAliqISS | 3,00% | Alíquota ISS municipal |
| tpRetISSQN | 1 | Retenção pelo tomador |
| PIS CST | 01 | Tributado à alíquota básica |
| COFINS CST | 01 | Tributado à alíquota básica |
| tpRetPisCofins | 3 | Retenção 4,65% pelo tomador |`
      },
      {
        id: 'p2-cindop',
        titulo: '2.2 cIndOp — Indicador de Operação',
        conteudo: `O campo cIndOp identifica a natureza da operação de serviço na NFS-e Nacional. Use a tabela abaixo para escolher o código correto:

| cIndOp | Descrição | Quando usar |
|--------|-----------|-------------|
| 050101 | Serviço prestado no estabelecimento do prestador | Serviço feito na oficina da Gera Vale |
| 050102 | Serviço prestado no estabelecimento do tomador | Técnico foi até o cliente |
| 050103 | Serviço prestado em via pública | Casos em campo (raro) |
| 050104 | Serviço prestado em outro local | Outros locais não enquadrados |
| 100301 | Fornecimento de mercadoria com prestação de serviço | Quando há venda de óleo junto ao serviço |

**Dica:** Em manutenções preventivas e corretivas realizadas nas instalações do cliente, use **050102**. Em revisões realizadas na oficina, use **050101**.`
      },
      {
        id: 'p2-nfe-oleo',
        titulo: '2.3 NF-e — Óleo Lubrificante',
        conteudo: `Quando a Gera Vale fornece óleo lubrificante, emite uma NF-e de produto separada da NFS-e de serviço.

**Campos obrigatórios:**

| Campo | Valor | Observação |
|-------|-------|------------|
| CFOP | 5405 | Venda dentro do estado de SP |
| CFOP | 6403 | Venda interestadual |
| NCM | 3403.99.00 | Lubrificantes sólidos ou semissólidos de petróleo |
| CEST | 06.017.00 | Código de substituição tributária |
| orig | 2 | Estrangeiro — de procedência conhecida |
| CST ICMS | 10 ou 70 | Tributado com ST |
| pICMS | 4% | Alíquota interestadual de produto importado |
| ICMS-ST | varia por UF | Ver tabela 2.4 |
| Base PIS/COFINS | vProd − vICMS próprio | Deduz ICMS do próprio da base PIS/COFINS |
| pPIS | 1,65% | Regime não-cumulativo |
| pCOFINS | 7,6% | Regime não-cumulativo |`
      },
      {
        id: 'p2-icmsst',
        titulo: '2.4 ICMS-ST por Estado de Destino',
        conteudo: `A substituição tributária do ICMS para óleos lubrificantes varia conforme o estado de destino. Os principais estados em que a Gera Vale opera:

| UF | MVA / Alíquota ST | Observação |
|----|------------------|------------|
| SP | 18% | Dentro do estado |
| PE | 20,5% | Interestadual |
| ES | 17% | Interestadual |

> ⚠ As alíquotas podem mudar com protocolos ICMS. Sempre verifique o convênio vigente antes de emitir.

**Como calcular o ICMS-ST:**
1. Base de cálculo ST = (valor do produto + frete + seguro + outras despesas − desconto) × (1 + MVA%)
2. ICMS-ST = Base ST × alíquota interna do estado destino − ICMS da operação própria`
      },
      {
        id: 'p2-conserto',
        titulo: '2.5 NF-e — Conserto (Par de Notas)',
        conteudo: `Quando um componente é retirado do cliente para conserto na oficina, são necessárias **duas NF-e**:

**1ª NF-e — Remessa para conserto:**
- CFOP 5.915 (dentro de SP) ou 6.915 (interestadual)
- Natureza: "Remessa para conserto"
- CFOP aplica-se a todos os itens enviados
- Sem destaque de ICMS (operação não tributada)
- PIS/COFINS: CST 07 (não tributada — remessa para industrialização/conserto)

**2ª NF-e — Retorno do conserto:**
- CFOP 5.916 (dentro de SP) ou 6.916 (interestadual)
- Natureza: "Retorno de mercadoria utilizada em conserto"
- Os itens e valores devem ser **idênticos** à NF-e de remessa
- CFOP e demais dados devem espelhar a entrada

**⚠ Importante:** Os dois documentos formam um par. O sistema do cliente vai casar a NF-e de retorno com a de remessa. Qualquer divergência de código de produto, quantidade ou valor vai gerar problema na escrituração do cliente.`
      }
    ]
  },
  {
    id: 'parte3',
    titulo: 'Parte 3 — Procedimentos e Boas Práticas',
    icon: '✅',
    secoes: [
      {
        id: 'p3-antes',
        titulo: '3.1 Antes de Emitir a Nota',
        conteudo: `**Checklist pré-emissão:**

1. **Confirme o CNPJ do cliente** — verifique no sistema e no contrato antes de emitir. Um CNPJ errado pode inviabilizar o crédito fiscal do cliente.

2. **Identifique o tipo de operação:**
   - Somente serviço → NFS-e
   - Serviço + óleo → NFS-e de serviço + NF-e de produto
   - Conserto fora da planta → Par de NF-e (remessa + retorno)

3. **Verifique o estado de destino** — para a NF-e de óleo, o estado influencia o CFOP (5405 = SP, 6403 = outros) e a alíquota de ICMS-ST.

4. **Confirme o cIndOp** — o indicador de operação na NFS-e deve refletir onde o serviço foi prestado.

5. **Verifique se há APR** — se o contrato prevê APR, confirme se o documento foi entregue antes de concluir o ciclo.`
      },
      {
        id: 'p3-conferencia',
        titulo: '3.2 Conferência Pós-Emissão',
        conteudo: `Após receber o XML da nota emitida (seja pela prefeitura ou SEFAZ), confira:

**NFS-e:**
- Abra o XML e localize a tag \`<infDPS>\`
- Confira cTribNac, cTribMun, cIndOp e cLocPrestacao
- Use a aba "Verificação automática" do Conferidor de Notas deste app

**NF-e:**
- Localize a chave de acesso (44 dígitos)
- Confira CFOP, NCM, origem, alíquotas
- Use o Conferidor de Notas para validação automática

**Retenções:**
- Verifique se o DARF de retenção PIS/COFINS/CSLL foi gerado corretamente
- ISS retido: confira no DISS da prefeitura de SJC`
      },
      {
        id: 'p3-problemas',
        titulo: '3.3 Problemas Comuns e Soluções',
        conteudo: `**Problema: Cliente não aceita a nota por CFOP errado**
→ O cliente verifica se o CFOP na nota corresponde à operação que ele registrou no sistema. Emita carta de correção (CC-e) se possível, ou cancele e reemita.

**Problema: ISS retido a maior**
→ Pode ocorrer se o cliente aplicou uma alíquota diferente de 3%. Solicite ao departamento fiscal do cliente a nota de pagamento e compare com o que foi retido.

**Problema: NF-e de retorno de conserto diverge da remessa**
→ O cliente vai rejeitar ou bloquear o pagamento. Cancele a NF-e de retorno e reemita com os mesmos itens, quantidades e valores da remessa. Se houve diferença de preço durante o conserto, emita uma nota complementar separada.

**Problema: Base de PIS/COFINS incorreta no óleo**
→ A base deve ser vProd − vICMS próprio. Sistemas configurados incorretamente às vezes usam o valor total. Solicite reemissão ao fornecedor ou corrija na escrita fiscal.

**Problema: cIndOp incorreto na NFS-e**
→ Cancele a NFS-e e reemita com o cIndOp correto. O prazo de cancelamento é de 24h após a emissão na maioria das prefeituras.`
      },
      {
        id: 'p3-reforma',
        titulo: '3.4 Reforma Tributária — IBS/CBS',
        conteudo: `A partir de 2026, a reforma tributária brasileira introduz o IBS (Imposto sobre Bens e Serviços) e a CBS (Contribuição sobre Bens e Serviços), substituindo progressivamente PIS, COFINS e parte do ICMS/ISS.

**O que muda nas notas:**
- NFS-e Nacional já prevê campos para IBS e CBS
- CST IBS/CBS: use **000** para operações tributadas normalmente
- cClassTrib: **000001** para operações padrão

**Período de transição:**
- 2026–2032: IBS/CBS convivem com os tributos antigos
- A partir de 2033: extinção gradual dos tributos antigos

> 📌 Mantenha-se atualizado: as regras da reforma tributária estão sendo regulamentadas por Resoluções do Comitê Gestor do IBS e Portarias da RFB. Consulte o seu contador para as alíquotas vigentes no período.`
      }
    ]
  }
]

// ── Componente ────────────────────────────────────────────────────────────────
function renderConteudo(texto) {
  // Renderiza markdown básico: **bold**, `code`, tabelas, listas, --- e quebras
  const lines = texto.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Tabela
    if (line.trim().startsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      // Skip separator row
      const rows = tableLines.filter(l => !l.match(/^\s*\|[\s\-|]+\|\s*$/))
      elements.push(
        <div key={i} style={{ overflowX: 'auto', marginBottom: 14 }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
            {rows.map((row, ri) => {
              const cells = row.split('|').slice(1, -1).map(c => c.trim())
              const Tag = ri === 0 ? 'th' : 'td'
              return (
                <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}>
                  {cells.map((cell, ci) => (
                    <Tag key={ci} style={{
                      padding: '6px 12px', textAlign: 'left',
                      background: ri === 0 ? 'var(--bg-3)' : 'transparent',
                      color: ri === 0 ? 'var(--text-2)' : 'var(--text)',
                      fontSize: ri === 0 ? 11 : 12, fontWeight: ri === 0 ? 600 : 400,
                      letterSpacing: ri === 0 ? '.04em' : 'normal',
                    }}>
                      <span dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code style="font-family:DM Mono,monospace;font-size:11px;background:var(--bg-3);padding:1px 5px;border-radius:3px">$1</code>') }} />
                    </Tag>
                  ))}
                </tr>
              )
            })}
          </table>
        </div>
      )
      continue
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const bqLines = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        bqLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      elements.push(
        <div key={i} style={{ borderLeft: '3px solid var(--blue)', paddingLeft: 12, margin: '10px 0', color: 'var(--text-2)', fontSize: 12 }}>
          {bqLines.map((l, li) => <div key={li} dangerouslySetInnerHTML={{ __html: formatInline(l) }} />)}
        </div>
      )
      continue
    }

    // List item
    if (line.match(/^\d+\.\s/) || line.match(/^[-*]\s/)) {
      const listLines = []
      while (i < lines.length && (lines[i].match(/^\d+\.\s/) || lines[i].match(/^[-*]\s/) || lines[i].match(/^\s{2,}/))) {
        listLines.push(lines[i])
        i++
      }
      elements.push(
        <ul key={i} style={{ paddingLeft: 18, marginBottom: 12 }}>
          {listLines.filter(l => l.trim()).map((l, li) => (
            <li key={li} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4, lineHeight: 1.6 }}>
              <span dangerouslySetInnerHTML={{ __html: formatInline(l.replace(/^(\d+\.|-|\*)\s/, '')) }} />
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Empty line
    if (!line.trim()) {
      elements.push(<div key={i} style={{ height: 8 }} />)
      i++
      continue
    }

    // Normal paragraph
    elements.push(
      <p key={i} style={{ fontSize: 12, color: 'var(--text)', marginBottom: 8, lineHeight: 1.7 }}>
        <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      </p>
    )
    i++
  }

  return elements
}

function formatInline(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="font-family:DM Mono,monospace;font-size:11px;background:var(--bg-3);padding:1px 5px;border-radius:3px">$1</code>')
}

export default function Manual() {
  const [parteAberta, setParteAberta] = useState('parte1')
  const [secaoAberta, setSecaoAberta] = useState('p1-visao')

  const parteAtual = MANUAL.find(p => p.id === parteAberta) || MANUAL[0]
  const secaoAtual = parteAtual.secoes.find(s => s.id === secaoAberta) || parteAtual.secoes[0]

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav crumbs={[{ label: 'Manual Fiscal' }]} />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 28px', display: 'grid', gridTemplateColumns: '230px 1fr', gap: 28 }}>

        {/* Sidebar */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 12 }}>Manual Fiscal Gera Vale</div>
          {MANUAL.map(parte => (
            <div key={parte.id} style={{ marginBottom: 8 }}>
              <button
                onClick={() => { setParteAberta(parte.id); setSecaoAberta(parte.secoes[0].id) }}
                style={{
                  width: '100%', textAlign: 'left', background: parteAberta === parte.id ? 'var(--bg-3)' : 'transparent',
                  border: parteAberta === parte.id ? '1px solid var(--border)' : '1px solid transparent',
                  borderRadius: 7, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7
                }}
              >
                <span style={{ fontSize: 14 }}>{parte.icon}</span>
                <span style={{ fontSize: 12, fontWeight: parteAberta === parte.id ? 600 : 400, color: parteAberta === parte.id ? 'var(--text)' : 'var(--text-2)' }}>{parte.titulo}</span>
              </button>

              {parteAberta === parte.id && (
                <div style={{ marginTop: 4, paddingLeft: 10 }}>
                  {parte.secoes.map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setSecaoAberta(sec.id)}
                      style={{
                        width: '100%', textAlign: 'left', background: 'none',
                        border: 'none', padding: '5px 8px', cursor: 'pointer', borderRadius: 5,
                        borderLeft: `2px solid ${secaoAberta === sec.id ? 'var(--blue)' : 'transparent'}`,
                      }}
                    >
                      <span style={{ fontSize: 11, color: secaoAberta === sec.id ? 'var(--text)' : 'var(--text-2)', fontWeight: secaoAberta === sec.id ? 500 : 400 }}>{sec.titulo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Conteúdo */}
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>{parteAtual.titulo}</div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>{secaoAtual.titulo}</h2>
          </div>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px' }}>
            {renderConteudo(secaoAtual.conteudo)}
          </div>

          {/* Navegação */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            {(() => {
              const allSecs = MANUAL.flatMap(p => p.secoes.map(s => ({ ...s, parteId: p.id })))
              const idx = allSecs.findIndex(s => s.id === secaoAberta)
              const prev = allSecs[idx - 1]
              const next = allSecs[idx + 1]
              return (
                <>
                  {prev ? (
                    <button onClick={() => { setParteAberta(prev.parteId); setSecaoAberta(prev.id) }}
                      style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 7, padding: '6px 14px', fontSize: 11, color: 'var(--text-2)', cursor: 'pointer' }}>
                      ‹ {prev.titulo}
                    </button>
                  ) : <div />}
                  {next && (
                    <button onClick={() => { setParteAberta(next.parteId); setSecaoAberta(next.id) }}
                      style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 7, padding: '6px 14px', fontSize: 11, color: 'var(--text-2)', cursor: 'pointer' }}>
                      {next.titulo} ›
                    </button>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
