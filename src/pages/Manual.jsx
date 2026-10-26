import React, { useState } from 'react'
import Nav from '../components/Nav'

// ── Componentes de layout ────────────────────────────────────────────────────
function Section({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', borderBottom: '2px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function SubSection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 3, height: 14, background: 'var(--blue)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
        {title}
      </h3>
      {children}
    </div>
  )
}

function FieldTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--bg-3)' }}>
            <th style={th}>Campo</th>
            <th style={th}>Valor</th>
            <th style={th}>Tipo</th>
            <th style={{ ...th, borderRight: 'none' }}>Observação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
              <td style={{ ...td, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: 'var(--text)' }}>{row[0]}</td>
              <td style={{ ...td, fontFamily: 'DM Mono, monospace', color: 'var(--blue)' }}>{row[1]}</td>
              <td style={{ ...td }}>
                <Tag type={row[2]} />
              </td>
              <td style={{ ...td, color: 'var(--text-2)', borderRight: 'none' }}>{row[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const th = { padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-2)', borderRight: '1px solid var(--border)' }
const td = { padding: '6px 10px', borderRight: '1px solid var(--border)', verticalAlign: 'top' }

function Tag({ type }) {
  const map = {
    fixo: { label: 'Fixo', bg: 'var(--green-bg)', color: 'var(--green-text)' },
    variavel: { label: 'Variável', bg: 'var(--yellow-bg)', color: 'var(--yellow-text)' },
    conferir: { label: 'Conferir', bg: 'var(--red-bg)', color: 'var(--red-text)' },
    calcular: { label: 'Calcular', bg: '#1e3a5f', color: '#6cb6ff' },
    omie: { label: 'Omie calc.', bg: 'var(--bg-3)', color: 'var(--text-2)' },
  }
  const t = map[type] || map.fixo
  return <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
}

function Alert({ type = 'warning', children }) {
  const map = {
    warning: { bg: 'var(--yellow-bg)', border: '#FFA657', icon: '⚠️' },
    error: { bg: 'var(--red-bg)', border: 'var(--red)', icon: '⛔' },
    info: { bg: 'var(--bg-3)', border: 'var(--blue)', icon: 'ℹ️' },
    ok: { bg: 'var(--green-bg)', border: 'var(--green)', icon: '✅' },
  }
  const s = map[type]
  return (
    <div style={{ borderLeft: `3px solid ${s.border}`, background: s.bg, borderRadius: '0 6px 6px 0', padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
      <span style={{ marginRight: 6 }}>{s.icon}</span>{children}
    </div>
  )
}

function Copy({ label, value }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>{label}</div>}
      <div style={{ display: 'flex', gap: 6 }}>
        <code style={{ flex: 1, padding: '7px 10px', background: 'var(--bg-3)', borderRadius: 6, fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text)', border: '1px solid var(--border)', wordBreak: 'break-all', lineHeight: 1.5 }}>
          {value}
        </code>
        <button
          onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          style={{ padding: '7px 12px', background: copied ? 'var(--green-bg)' : 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: copied ? 'var(--green-text)' : 'var(--text-2)', flexShrink: 0, transition: 'background .15s' }}
        >
          {copied ? '✓' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

// ── Dados ───────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'nfse', label: 'NFS-e — Serviço' },
  { id: 'nfe-oleo', label: 'NF-e — Óleo' },
  { id: 'nfe-conserto', label: 'NF-e — Conserto' },
  { id: 'nfe-importado', label: 'NF-e — Importado' },
]

// ── Componente principal ─────────────────────────────────────────────────────
export default function Manual() {
  const [activeSection, setActiveSection] = useState('nfse')

  function scrollTo(id) {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav crumbs={[{ label: 'Manual Fiscal' }]} />
      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '28px 24px', gap: 28 }}>

        {/* Sidebar nav */}
        <aside style={{ width: 180, flexShrink: 0 }}>
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 8 }}>Seções</div>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, background: activeSection === s.id ? 'var(--bg-3)' : 'transparent', color: activeSection === s.id ? 'var(--text)' : 'var(--text-2)', marginBottom: 2, fontWeight: activeSection === s.id ? 600 : 400 }}>
                {s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Conteúdo */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Manual Fiscal — Gera Vale</h1>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Referência para emissão de notas fiscais no Omie. Atualizado em 2026.</p>
          </div>

          {/* ── NFS-e ── */}
          <Section id="nfse" title="Parte 1 — NFS-e (Nota Fiscal de Serviço Eletrônica)">

            <Alert type="info">
              Utilizada para faturamento de serviços de manutenção preventiva, corretiva ou contrato de assistência técnica em compressores Kaeser.
            </Alert>

            <SubSection title="Dados do Prestador">
              <FieldTable rows={[
                ['Empresa', 'Gera Vale Kompressoren Ltda', 'fixo', 'Emitente da NFS-e'],
                ['CNPJ', '19.090.416/0001-76', 'fixo', 'Sempre verificar antes de emitir'],
                ['Endereço serviço', 'São José dos Campos – SP', 'fixo', 'Local de prestação padrão'],
              ]} />
            </SubSection>

            <SubSection title="Identificação do Serviço">
              <FieldTable rows={[
                ['cTribNac', '140101', 'fixo', 'Serviços de conservação, manutenção e reparação de máquinas'],
                ['cTribMun', '0068', 'fixo', 'Manutenção e conservação de máquinas e equipamentos'],
                ['cNBS', '1.0306.0.10.00 ou similar', 'conferir', 'Código NBS para serviços de manutenção; conferir na tabela NBS vigente'],
                ['cIndOp', 'Ver tabela abaixo', 'conferir', 'Indicador de operação — depende do local de prestação'],
                ['cLocPrestacao', '3549904', 'fixo', 'IBGE São José dos Campos'],
              ]} />

              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, marginTop: 12 }}>Tabela cIndOp</div>
              <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-3)' }}>
                      <th style={th}>Código</th><th style={th}>Situação</th><th style={{ ...th, borderRight: 'none' }}>Quando usar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['050101', 'Serviço prestado no estabelecimento do prestador', 'Máquina veio até a Gera Vale (oficina)'],
                      ['050102', 'Serviço prestado no estabelecimento do tomador', 'Técnico foi ao cliente'],
                      ['050103', 'Serviço prestado em local diverso', 'Outro endereço que não é do cliente nem da GV'],
                      ['050104', 'Serviço prestado no exterior', 'Raramente usado'],
                      ['100301', 'Comissão', 'Comissão Kaeser — cTribNac 100901'],
                    ].map(([cod, desc, obs], i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ ...td, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: 'var(--blue)' }}>{cod}</td>
                        <td style={td}>{desc}</td>
                        <td style={{ ...td, color: 'var(--text-2)', borderRight: 'none' }}>{obs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>

            <SubSection title="Impostos">
              <FieldTable rows={[
                ['ISS', '3%', 'fixo', 'Alíquota municipal SJC para 0068'],
                ['Retenção ISS', 'Depende do tomador', 'conferir', 'tpRetISSQN = 1 se tomador PJ retém; = 2 se GV retém; = 3 se isento'],
                ['PIS', '0,65% — CST 01', 'fixo', 'Tributação normal PIS serviço'],
                ['COFINS', '3,00% — CST 01', 'fixo', 'Tributação normal COFINS serviço'],
                ['Retenção PIS/COFINS', '4,65% (tpRetPisCofins = 3)', 'conferir', 'Obrigatória se tomador PJ não-Simples e nota ≥ R$ 215,06'],
                ['IBS', '0,10% — CST 000 / cClassTrib 000001', 'fixo', 'Reforma tributária — destacar quando exigido'],
                ['CBS', '0,90% — CST 000 / cClassTrib 000001', 'fixo', 'Reforma tributária — destacar quando exigido'],
              ]} />
            </SubSection>

            <SubSection title="Informações Complementares — Serviço">
              <Copy label="Padrão manutenção" value="Serviços de manutenção e assistência técnica em compressores de ar. CNPJ GV: 19.090.416/0001-76. Optante pelo Lucro Presumido. PIS/COFINS retidos na fonte pelo tomador conforme IN SRF 459/2004." />
              <Copy label="Comissão Kaeser" value="Comissão sobre venda de compressores Kaeser. CNPJ GV: 19.090.416/0001-76. Optante pelo Lucro Presumido." />
            </SubSection>

          </Section>

          {/* ── NF-e Óleo ── */}
          <Section id="nfe-oleo" title="Parte 2 — NF-e Óleo / Lubrificante">

            <Alert type="info">
              Óleo lubrificante para compressores Kaeser — produto importado revendido pela Gera Vale. Sujeito a ICMS-ST dependendo do estado de destino.
            </Alert>

            <SubSection title="Identificação do Produto">
              <FieldTable rows={[
                ['NCM', '3403.99.00', 'fixo', 'Preparações lubrificantes sem petróleo'],
                ['CEST', '06.017.00', 'fixo', 'Óleo lubrificante — substituição tributária'],
                ['Origem', '2', 'fixo', 'Estrangeiro — procedência conhecida (importado)'],
                ['CFOP (SP)', '5.405', 'fixo', 'Venda de mercadoria com ST no estado'],
                ['CFOP (interestadual)', '6.403', 'fixo', 'Venda interestadual com recolhimento da ST pelo remetente'],
                ['Nat. Operação', 'Venda com substituição tributária', 'fixo', ''],
              ]} />
            </SubSection>

            <SubSection title="ICMS e ICMS-ST por Estado">
              <FieldTable rows={[
                ['ICMS próprio', '4%', 'fixo', 'Interestadual — produto importado (Res. Senado 13/2012)'],
                ['CST ICMS (SP)', '60', 'fixo', 'SP — ST já recolhida na entrada; sem novo ICMS-ST'],
                ['CST ICMS (outros)', '10', 'fixo', 'Tributado com ST — Omie calcula base se configurado'],
              ]} />

              <Alert type="warning">
                <strong>PE — fórmula específica (digitar manualmente):</strong> IVA-ST 45,09%. Base ST = (vProd + frete + seguro + outros − descontos) × (1 + 45,09%). ICMS-ST = (base ST × 20,5%) − ICMS origem. Conferir MVA em vigor junto à SEFAZ-PE.
              </Alert>
              <Alert type="warning">
                <strong>ES — fórmula genérica:</strong> Base ST = vProd × (1 + IVA-ST vigente). ICMS-ST = (base ST × 17%) − ICMS origem. O Omie calcula automaticamente se o protocolo estiver configurado.
              </Alert>
              <Alert type="info">
                <strong>Outros estados sem ST:</strong> Verificar se há protocolo ICMS entre SP e o estado de destino. Quando não há ST, usar CFOP 6.102 e CST 00.
              </Alert>
            </SubSection>

            <SubSection title="PIS/COFINS">
              <FieldTable rows={[
                ['CST PIS/COFINS', '01', 'fixo', 'Tributação normal — Lucro Presumido'],
                ['PIS', '1,65%', 'fixo', ''],
                ['COFINS', '7,60%', 'fixo', ''],
                ['Base PIS/COFINS', 'vProd − ICMS próprio', 'calcular', 'NÃO incluir ICMS-ST na base. IPI nunca entra (produto não tributado por IPI)'],
              ]} />
            </SubSection>

            <SubSection title="IBS / CBS (Reforma Tributária)">
              <FieldTable rows={[
                ['CST IBS/CBS', '000', 'fixo', 'Tributação plena'],
                ['cClassTrib', '000001', 'fixo', 'Classificação padrão mercadoria'],
                ['CBS', '0,90%', 'fixo', ''],
                ['IBS', '0,10%', 'fixo', 'Alíquota municipal padrão SJC'],
              ]} />
            </SubSection>

            <SubSection title="Procedimentos pós-emissão">
              <Alert type="warning">
                Após autorizar NF-e com ICMS-ST para PE ou ES, emitir GNRE no portal da SEFAZ do estado de destino antes de iniciar o transporte.
              </Alert>
            </SubSection>

          </Section>

          {/* ── NF-e Conserto ── */}
          <Section id="nfe-conserto" title="Parte 3 — NF-e Conserto">

            <Alert type="info">
              Operação em duas NF-e: <strong>remessa para conserto</strong> (enviada pelo cliente) e <strong>retorno do conserto</strong> (emitida pela Gera Vale na devolução). Não gera receita — apenas movimenta o equipamento fisicamente.
            </Alert>

            <SubSection title="Produto a utilizar no Omie">
              <FieldTable rows={[
                ['Produto', 'SCRKR — SECADOR', 'fixo', 'Usar sempre este produto genérico — nunca cadastrar produto novo'],
                ['NCM', '8419.39.00', 'fixo', 'NCM padrão do SCRKR; ajustar temporariamente se diferente (ver abaixo)'],
                ['Local estoque', 'E.MOV', 'fixo', 'Estoque de movimento para conserto'],
                ['Cat. produto (entrada)', 'Mercadoria recebida para conserto', 'fixo', ''],
                ['Loc. estoque saída', '(em branco)', 'fixo', 'Campo deve ficar vazio na NF de entrada'],
              ]} />
              <Alert type="error">
                Se o NCM do equipamento enviado for diferente de 8419.39.00: altere o NCM do produto SCRKR temporariamente, emita a NF de retorno e restaure imediatamente para 8419.39.00. Nunca deixe o NCM errado permanentemente.
              </Alert>
            </SubSection>

            <SubSection title="NF de Remessa (enviada pelo cliente)">
              <FieldTable rows={[
                ['CFOP (SP → SP)', '5.915', 'fixo', 'Remessa para conserto — intraestadual SP'],
                ['CFOP (outro estado → SP)', '6.915', 'fixo', 'Remessa interestadual para conserto'],
                ['Nat. Operação', 'Remessa para conserto/reparo', 'fixo', ''],
                ['CFOP registro GV (SP)', '1.915', 'fixo', 'Como a GV registra a entrada no Omie — SP'],
                ['CFOP registro GV (outro estado)', '2.915', 'fixo', 'Como a GV registra a entrada — interestadual'],
                ['Gera conta a pagar?', 'Não', 'fixo', 'Campo "não gera conta a pagar" deve ser marcado'],
                ['Movimenta estoque?', 'Não', 'fixo', 'Campo "não movimenta estoque" deve ser desmarcado (não movimenta o financeiro)'],
              ]} />
            </SubSection>

            <SubSection title="NF de Retorno (emitida pela Gera Vale)">
              <FieldTable rows={[
                ['CFOP (SP → SP)', '5.916', 'fixo', 'Retorno de conserto — intraestadual SP'],
                ['CFOP (SP → outro estado)', '6.916', 'fixo', 'Retorno interestadual de conserto'],
                ['Nat. Operação', 'Retorno de mercadoria recebida para conserto', 'fixo', ''],
                ['ICMS CST', '41', 'fixo', 'Não tributado — art. 7º, IX do RICMS/SP (conserto)'],
                ['Valores', 'Iguais à NF de remessa', 'fixo', 'O Omie gera a NF de retorno a partir da entrada'],
                ['CNPJ destinatário', 'CNPJ do cliente (remetente original)', 'conferir', 'Verificar se o Omie preencheu corretamente'],
                ['Estoque saída (E.MOV)', 'E.MOV', 'fixo', 'Local de saída do estoque deve ser E.MOV'],
              ]} />

              <Alert type="ok">
                <strong>Como gerar no Omie:</strong> Abra a NF de entrada (remessa) → botão "Gerar NF de Retorno" → o sistema cria automaticamente a NF 5916/6916 com os valores espelhados. Conferir NCM, CNPJ, valores antes de transmitir.
              </Alert>
            </SubSection>

            <SubSection title="Checklist conserto">
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {[
                  'NF de remessa registrada no Omie (1.915 ou 2.915)',
                  'Produto associado ao SCRKR — nunca produto novo',
                  'NCM igual ao da NF do cliente — ajustar SCRKR se necessário',
                  'NF de retorno gerada a partir da NF de entrada (botão Omie)',
                  'Valores idênticos entre remessa e retorno',
                  'CNPJ destinatário correto no retorno',
                  'ICMS CST 41 no retorno',
                  'Se NCM foi alterado: restaurar para 8419.39.00 após transmissão',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-3)', minWidth: 20 }}>{i + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </SubSection>

          </Section>

          {/* ── NF-e Importado ── */}
          <Section id="nfe-importado" title="Parte 4 — NF-e Produto Importado">

            <Alert type="info">
              Equipamentos importados diretamente pela Gera Vale. A Gera Vale é equiparada a indústria para fins de IPI (RIPI/2010, Decreto 7.212, art. 9º, I). ICMS interestadual de 4% (Res. Senado 13/2012).
            </Alert>

            <SubSection title="Identificação do Produto">
              <FieldTable rows={[
                ['Origem', '1', 'fixo', 'Estrangeiro — importação direta pela própria empresa'],
                ['NCM', 'Conforme produto', 'variavel', 'Verificar NCM correto na ficha técnica'],
                ['CFOP', 'Ver tabela abaixo', 'conferir', 'Depende do destino da mercadoria pelo comprador'],
              ]} />

              <div style={{ overflowX: 'auto', marginBottom: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-3)' }}>
                      <th style={th}>CFOP</th><th style={th}>Situação</th><th style={{ ...th, borderRight: 'none' }}>Quando usar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['6.102', 'Venda interestadual — revenda / industrialização', 'Cliente vai revender ou usar na produção (Cenário A)'],
                      ['6.108', 'Venda interestadual — consumidor final contribuinte (c/ DIFAL)', 'Empresa que vai usar o equipamento e está sujeita ao DIFAL'],
                      ['6.102', 'Consumidor final contribuinte — DIFAL de responsabilidade do comprador', 'GV emite 6.102; comprador recolhe o DIFAL no destino'],
                    ].map(([cod, desc, obs], i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ ...td, fontFamily: 'DM Mono, monospace', fontWeight: 600, color: 'var(--blue)' }}>{cod}</td>
                        <td style={td}>{desc}</td>
                        <td style={{ ...td, color: 'var(--text-2)', borderRight: 'none' }}>{obs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>

            <SubSection title="Cenário A — Revenda / Industrialização">
              <Alert type="info">Comprador vai revender o equipamento ou usá-lo na produção. <strong>Consumidor Final = NÃO</strong>.</Alert>
              <FieldTable rows={[
                ['Consumidor Final', 'Não', 'fixo', 'Campo no Omie deve estar desmarcado'],
                ['Base ICMS', 'Valor dos produtos apenas', 'fixo', 'NÃO incluir IPI na base (CF art. 155 §2º XI)'],
                ['ICMS interestadual', '4%', 'fixo', 'Origem 1 — Res. Senado 13/2012'],
                ['DIFAL na NF', 'Não aplicável', 'fixo', 'Sem DIFAL para revenda/industrialização'],
                ['IPI CST', '50', 'fixo', 'Saída tributada — Gera Vale equiparada a indústria'],
                ['Alíquota IPI', 'Conforme TIPI', 'conferir', 'Verificar alíquota na tabela TIPI para o NCM do produto'],
                ['Base IPI', 'Valor dos produtos', 'fixo', 'NÃO incluir ICMS na base IPI'],
              ]} />
            </SubSection>

            <SubSection title="Cenário B — Uso e Consumo (Ativo Imobilizado)">
              <Alert type="warning">Comprador vai usar o equipamento (consumidor final). <strong>Consumidor Final = SIM</strong>. DIFAL incide sobre o diferencial de alíquota.</Alert>
              <FieldTable rows={[
                ['Consumidor Final', 'Sim', 'fixo', 'Campo no Omie deve estar marcado'],
                ['Base ICMS', 'Produtos + IPI', 'fixo', 'Quando consumidor final, IPI integra a base ICMS'],
                ['ICMS interestadual', '4%', 'fixo', 'Origem 1 — Res. Senado 13/2012'],
                ['DIFAL', 'Devido pelo estado de destino', 'conferir', 'GV emite CFOP 6.102; comprador recolhe DIFAL no estado dele'],
                ['IPI CST', '50', 'fixo', ''],
                ['Alíquota IPI', 'Conforme TIPI', 'conferir', 'Verificar alíquota na tabela TIPI'],
              ]} />

              <Alert type="error">
                <strong>Erro histórico — NF-e 3.594 (Fiedler, SC):</strong> Nota emitida com "Consumidor Final = Sim" quando deveria ser revenda. A base ICMS ficou em R$ 5.500 (vProd + IPI) em vez de R$ 5.000 (só vProd). Diferença de R$ 500 na base incorreta. Conferir este campo cuidadosamente antes de transmitir.
              </Alert>
            </SubSection>

            <SubSection title="PIS / COFINS">
              <FieldTable rows={[
                ['CST', '01', 'fixo', 'Tributação normal — Lucro Presumido'],
                ['PIS', '1,65%', 'fixo', ''],
                ['COFINS', '7,60%', 'fixo', ''],
                ['Base PIS/COFINS', 'Produtos − ICMS próprio', 'fixo', 'IPI nunca entra na base PIS/COFINS (LC 87/1996 art. 13 §2º)'],
              ]} />
            </SubSection>

            <SubSection title="IBS / CBS (Reforma Tributária)">
              <FieldTable rows={[
                ['CST IBS/CBS', '000', 'fixo', 'Tributação plena'],
                ['cClassTrib', '000001', 'fixo', ''],
                ['CBS', '0,90%', 'fixo', ''],
                ['IBS', '0,10%', 'fixo', ''],
              ]} />
            </SubSection>

            <SubSection title="Informações Complementares — Importado">
              <Copy label="Cenário A (revenda)" value="Produto importado diretamente pela Gera Vale Kompressoren Ltda (CNPJ 19.090.416/0001-76), equiparada a indústria nos termos do art. 9º, I do RIPI/2010 (Dec. 7.212/2010). ICMS interestadual 4% — Res. Senado 13/2012. IPI destacado conforme TIPI. Base ICMS = valor dos produtos (CF art. 155 §2º XI; LC 87/1996 art. 13 §2º). Operação: revenda/industrialização — consumidor final: NÃO." />
              <Copy label="Cenário B (uso e consumo)" value="Produto importado diretamente pela Gera Vale Kompressoren Ltda (CNPJ 19.090.416/0001-76), equiparada a indústria nos termos do art. 9º, I do RIPI/2010 (Dec. 7.212/2010). ICMS interestadual 4% — Res. Senado 13/2012. IPI destacado conforme TIPI. Base ICMS = vProd + IPI (consumidor final). DIFAL de responsabilidade do adquirente nos termos do Protocolo ICMS e CF art. 155 §2º, VII." />
            </SubSection>

            <SubSection title="Base legal">
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
                <div>• <strong>CF art. 155 §2º XI</strong> — IPI não integra base ICMS quando destinatário for contribuinte e produto sujeito ao IPI</div>
                <div>• <strong>LC 87/1996 art. 13 §2º</strong> — IPI não compõe base de cálculo do ICMS na saída para não-contribuinte quando tributado por ambos</div>
                <div>• <strong>RIPI/2010 — Decreto 7.212 art. 9º I</strong> — Equiparação a estabelecimento industrial para importadores</div>
                <div>• <strong>Res. Senado 13/2012</strong> — Alíquota ICMS interestadual de 4% para produtos importados ou com conteúdo de importação ≥ 40%</div>
              </div>
            </SubSection>

          </Section>

        </main>
      </div>
    </div>
  )
}
