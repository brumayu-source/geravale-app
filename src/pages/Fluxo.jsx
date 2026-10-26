import React, { useState } from 'react'
import Nav from '../components/Nav'

// ── Estilos base ──────────────────────────────────────────────────────────────
const tagStyle = {
  fixo: { bg: 'var(--green-bg)', color: 'var(--green-text)', label: 'Fixo' },
  variavel: { bg: 'var(--yellow-bg)', color: 'var(--yellow-text)', label: 'Variável' },
  conferir: { bg: 'var(--red-bg)', color: 'var(--red-text)', label: 'Conferir' },
  calcular: { bg: '#1e3a5f', color: '#6cb6ff', label: 'Calcular' },
  omie: { bg: 'var(--bg-3)', color: 'var(--text-2)', label: 'Omie calc.' },
}

function Tag({ type }) {
  const t = tagStyle[type] || tagStyle.fixo
  return <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: t.bg, color: t.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{t.label}</span>
}

function FieldRow({ campo, valor, tipo, obs }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', alignItems: 'start', fontSize: 12 }}>
      <span style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text)', fontSize: 11 }}>{campo}</span>
      <div>
        <span style={{ color: 'var(--blue)', fontFamily: 'DM Mono, monospace' }}>{valor}</span>
        {obs && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{obs}</div>}
      </div>
      <Tag type={tipo} />
    </div>
  )
}

function Fields({ rows }) {
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 12px 8px', marginBottom: 10 }}>
      {rows.map((r, i) => <FieldRow key={i} campo={r[0]} valor={r[1]} tipo={r[2]} obs={r[3]} />)}
    </div>
  )
}

function Alert({ type = 'warning', children }) {
  const map = {
    warning: { border: '#FFA657', bg: 'var(--yellow-bg)', icon: '⚠️' },
    error: { border: 'var(--red)', bg: 'var(--red-bg)', icon: '⛔' },
    info: { border: 'var(--blue)', bg: 'var(--bg-3)', icon: 'ℹ️' },
    ok: { border: 'var(--green)', bg: 'var(--green-bg)', icon: '✅' },
  }
  const s = map[type]
  return (
    <div style={{ borderLeft: `3px solid ${s.border}`, background: s.bg, borderRadius: '0 6px 6px 0', padding: '9px 12px', marginBottom: 10, fontSize: 12 }}>
      <span style={{ marginRight: 6 }}>{s.icon}</span>{children}
    </div>
  )
}

// ── Cenários ──────────────────────────────────────────────────────────────────

const CENARIOS = {
  // ── SERVIÇO ──
  'srv-oficina': {
    label: 'Serviço — Avulso Oficina',
    emoji: '🔧',
    tipo: 'NFS-e',
    desc: 'Máquina trazida pelo cliente para manutenção na sede da Gera Vale em SJC.',
    steps: [
      'Agendar entrada do equipamento',
      'Emitir NFS-e ao finalizar o serviço',
      'Verificar retenções se tomador for PJ',
    ],
    fields: [
      ['Tipo nota', 'NFS-e', 'fixo'],
      ['cTribNac', '140101', 'fixo', 'Manutenção e conservação de máquinas'],
      ['cTribMun', '0068', 'fixo', 'Manutenção e conservação de máquinas (ISS SJC)'],
      ['cNBS', '1.0306.0.10.00 ou similar', 'conferir', 'Código NBS — verificar tabela vigente'],
      ['cIndOp', '050101', 'fixo', 'Serviço no estabelecimento do prestador (oficina GV)'],
      ['cLocPrestacao', '3549904', 'fixo', 'IBGE São José dos Campos'],
      ['ISS', '3%', 'fixo', 'Alíquota municipal SJC código 0068'],
      ['tpRetISSQN', 'Depende tomador', 'conferir', '1 = tomador retém; 2 = GV retém; 3 = isento'],
      ['PIS', '0,65% — CST 01', 'fixo'],
      ['COFINS', '3,00% — CST 01', 'fixo'],
      ['Ret. PIS/COFINS', '4,65% se PJ não-Simples ≥ R$215,06', 'conferir', 'tpRetPisCofins = 3'],
      ['IBS', '0,10% — CST 000 / cClassTrib 000001', 'fixo'],
      ['CBS', '0,90% — CST 000 / cClassTrib 000001', 'fixo'],
    ],
    alerts: [],
  },
  'srv-cliente': {
    label: 'Serviço — Avulso Cliente',
    emoji: '🚗',
    tipo: 'NFS-e',
    desc: 'Técnico da Gera Vale desloca-se ao estabelecimento do cliente para prestação de serviço.',
    steps: [
      'Confirmar endereço de destino antes da visita',
      'Registrar OS com local de prestação correto',
      'Emitir NFS-e após conclusão do serviço',
    ],
    fields: [
      ['Tipo nota', 'NFS-e', 'fixo'],
      ['cTribNac', '140101', 'fixo'],
      ['cTribMun', '0068', 'fixo'],
      ['cNBS', '1.0306.0.10.00 ou similar', 'conferir'],
      ['cIndOp', '050102', 'fixo', 'Serviço no estabelecimento do tomador (cliente)'],
      ['cLocPrestacao', '3549904', 'fixo', 'SJC — local tributário permanece SJC independente do deslocamento'],
      ['ISS', '3%', 'fixo'],
      ['tpRetISSQN', 'Depende tomador', 'conferir'],
      ['PIS', '0,65% — CST 01', 'fixo'],
      ['COFINS', '3,00% — CST 01', 'fixo'],
      ['Ret. PIS/COFINS', '4,65% se PJ não-Simples ≥ R$215,06', 'conferir'],
      ['IBS', '0,10% — CST 000 / cClassTrib 000001', 'fixo'],
      ['CBS', '0,90% — CST 000 / cClassTrib 000001', 'fixo'],
    ],
    alerts: [],
  },
  'srv-contrato': {
    label: 'Serviço — Contrato Mensal',
    emoji: '📋',
    tipo: 'NFS-e',
    desc: 'Faturamento recorrente de contrato de manutenção. Emitido mensalmente com valor fixo acordado.',
    steps: [
      'Verificar valor contratual e vigência',
      'Emitir NFS-e no início ou final do período (conforme contrato)',
      'Conferir retenções mensais acumuladas',
    ],
    fields: [
      ['Tipo nota', 'NFS-e', 'fixo'],
      ['cTribNac', '140101', 'fixo'],
      ['cTribMun', '0068', 'fixo'],
      ['cNBS', '1.0306.0.10.00 ou similar', 'conferir'],
      ['cIndOp', '050101 ou 050102', 'conferir', 'Depende se o contrato prevê serviço na oficina ou no cliente'],
      ['cLocPrestacao', '3549904', 'fixo'],
      ['ISS', '3%', 'fixo'],
      ['tpRetISSQN', 'Depende tomador', 'conferir'],
      ['PIS', '0,65% — CST 01', 'fixo'],
      ['COFINS', '3,00% — CST 01', 'fixo'],
      ['Ret. PIS/COFINS', '4,65% se PJ não-Simples ≥ R$215,06', 'conferir', 'Para contratos de valor alto, retenção é mensal'],
      ['IBS', '0,10% — CST 000 / cClassTrib 000001', 'fixo'],
      ['CBS', '0,90% — CST 000 / cClassTrib 000001', 'fixo'],
    ],
    alerts: [
      { type: 'info', msg: 'Para contratos com clientes grandes (ex.: Kaeser), verificar se há ISS na fonte conforme contrato social ou regulamento municipal do tomador.' },
    ],
  },

  // ── NF-e ÓLEO ──
  'oleo-sp': {
    label: 'Óleo — Destino SP',
    emoji: '🛢️',
    tipo: 'NF-e',
    desc: 'Venda de óleo lubrificante para cliente no estado de São Paulo. ICMS-ST já recolhida na entrada — não há nova ST.',
    steps: [
      'Verificar NCM 3403.99.00 e CEST 06.017.00 cadastrados no produto',
      'Emitir NF-e com CFOP 5.405',
      'ICMS CST 60 — ST já recolhida, sem novo destaque',
    ],
    fields: [
      ['Tipo nota', 'NF-e produto', 'fixo'],
      ['CFOP', '5.405', 'fixo', 'Venda de mercadoria com ST — intraestadual SP'],
      ['Nat. Operação', 'Venda com substituição tributária', 'fixo'],
      ['NCM', '3403.99.00', 'fixo'],
      ['CEST', '06.017.00', 'fixo'],
      ['Origem', '2', 'fixo', 'Estrangeiro — procedência conhecida'],
      ['CST ICMS', '60', 'fixo', 'ST anteriormente cobrada — sem novo ICMS-ST'],
      ['ICMS-ST', 'Não destacar', 'fixo'],
      ['Base PIS/COFINS', 'vProd − ICMS próprio', 'calcular', 'IPI não incide; ICMS-ST não entra na base'],
      ['PIS', '1,65% — CST 01', 'fixo'],
      ['COFINS', '7,60% — CST 01', 'fixo'],
      ['IBS', '0,10% — CST 000 / cClassTrib 000001', 'fixo'],
      ['CBS', '0,90% — CST 000 / cClassTrib 000001', 'fixo'],
    ],
    alerts: [],
  },
  'oleo-pe': {
    label: 'Óleo — Destino PE',
    emoji: '🛢️',
    tipo: 'NF-e',
    desc: 'Venda de óleo lubrificante para Pernambuco. ICMS-ST com fórmula específica do Protocolo PE — calcular e digitar manualmente.',
    steps: [
      'Obter MVA-ST atual junto à SEFAZ-PE',
      'Calcular ICMS-ST: base = (vProd + frete + seguro) × (1 + 45,09%); ST = (base × 20,5%) − ICMS origem',
      'Digitar o valor de ICMS-ST no Omie manualmente',
      'Emitir NF-e, autorizar e emitir GNRE para PE',
    ],
    fields: [
      ['Tipo nota', 'NF-e produto', 'fixo'],
      ['CFOP', '6.403', 'fixo', 'Venda interestadual com ST pelo remetente'],
      ['NCM', '3403.99.00', 'fixo'],
      ['CEST', '06.017.00', 'fixo'],
      ['Origem', '2', 'fixo'],
      ['CST ICMS', '10', 'fixo', 'Tributado com ST'],
      ['ICMS próprio', '4%', 'fixo', 'Interestadual produto importado'],
      ['IVA-ST PE', '45,09% (verificar)', 'conferir', 'Conferir MVA vigente na legislação PE'],
      ['Base ICMS-ST', 'vProd × (1 + IVA)', 'calcular', 'Incluir frete/seguro/acessórios na base'],
      ['Aliq. ICMS-ST', '20,5%', 'fixo', 'Alíquota interna PE para lubrificantes'],
      ['Valor ICMS-ST', '(base × 20,5%) − ICMS origem', 'calcular', 'Digitar manualmente no Omie'],
      ['PIS', '1,65% — CST 01', 'fixo'],
      ['COFINS', '7,60% — CST 01', 'fixo'],
      ['Base PIS/COFINS', 'vProd − ICMS próprio', 'calcular'],
      ['IBS', '0,10% — CST 000 / cClassTrib 000001', 'fixo'],
      ['CBS', '0,90% — CST 000 / cClassTrib 000001', 'fixo'],
    ],
    alerts: [
      { type: 'warning', msg: 'GNRE deve ser emitida para PE antes de iniciar o transporte. Acessar portal SEFAZ-PE após autorização da NF-e.' },
      { type: 'warning', msg: 'O Omie NÃO calcula automaticamente o ICMS-ST para PE. Inserir o valor calculado manualmente no campo de ICMS-ST.' },
    ],
  },
  'oleo-es': {
    label: 'Óleo — Destino ES',
    emoji: '🛢️',
    tipo: 'NF-e',
    desc: 'Venda de óleo lubrificante para Espírito Santo. ICMS-ST com fórmula genérica — o Omie calcula se o protocolo estiver configurado.',
    steps: [
      'Verificar se o protocolo ES está configurado no Omie',
      'Confirmar alíquota interna ES para lubrificantes (17%)',
      'Emitir NF-e e GNRE para ES após autorização',
    ],
    fields: [
      ['Tipo nota', 'NF-e produto', 'fixo'],
      ['CFOP', '6.403', 'fixo'],
      ['NCM', '3403.99.00', 'fixo'],
      ['CEST', '06.017.00', 'fixo'],
      ['Origem', '2', 'fixo'],
      ['CST ICMS', '10', 'fixo'],
      ['ICMS próprio', '4%', 'fixo'],
      ['Aliq. interna ES', '17%', 'fixo', 'Alíquota geral ES — lubrificantes'],
      ['Base ICMS-ST', 'vProd × (1 + IVA-ST ES)', 'omie', 'Omie calcula se protocolo configurado'],
      ['Valor ICMS-ST', '(base × 17%) − ICMS origem', 'omie', 'Omie calcula automaticamente'],
      ['PIS', '1,65% — CST 01', 'fixo'],
      ['COFINS', '7,60% — CST 01', 'fixo'],
      ['Base PIS/COFINS', 'vProd − ICMS próprio', 'calcular'],
      ['IBS', '0,10% — CST 000 / cClassTrib 000001', 'fixo'],
      ['CBS', '0,90% — CST 000 / cClassTrib 000001', 'fixo'],
    ],
    alerts: [
      { type: 'warning', msg: 'GNRE para ES deve ser emitida após autorização da NF-e, antes do transporte.' },
      { type: 'info', msg: 'Se o Omie não calcular o ICMS-ST automaticamente, verificar configuração do protocolo ES ou calcular manualmente com alíquota 17%.' },
    ],
  },
  'oleo-outro': {
    label: 'Óleo — Outro Estado',
    emoji: '🛢️',
    tipo: 'NF-e',
    desc: 'Venda de óleo lubrificante para estado sem protocolo ICMS com SP. Sem ICMS-ST — emitente não é responsável pela ST.',
    steps: [
      'Verificar se existe protocolo ICMS entre SP e o estado de destino',
      'Sem protocolo: emitir com CFOP 6.102 e CST 00',
      'Com protocolo: tratar como ES (fórmula genérica)',
    ],
    fields: [
      ['Tipo nota', 'NF-e produto', 'fixo'],
      ['CFOP', '6.102', 'fixo', 'Venda interestadual sem ST — sem protocolo com estado destino'],
      ['NCM', '3403.99.00', 'fixo'],
      ['CEST', '06.017.00', 'fixo', 'Manter mesmo sem ST — produto tem CEST'],
      ['Origem', '2', 'fixo'],
      ['CST ICMS', '00', 'fixo', 'Tributado integralmente sem ST'],
      ['ICMS próprio', '4%', 'fixo'],
      ['ICMS-ST', 'Não aplicável', 'fixo'],
      ['PIS', '1,65% — CST 01', 'fixo'],
      ['COFINS', '7,60% — CST 01', 'fixo'],
      ['Base PIS/COFINS', 'vProd − ICMS próprio', 'calcular'],
      ['IBS', '0,10% — CST 000 / cClassTrib 000001', 'fixo'],
      ['CBS', '0,90% — CST 000 / cClassTrib 000001', 'fixo'],
    ],
    alerts: [
      { type: 'info', msg: 'Antes de emitir, verificar no portal CONFAZ se há protocolo ICMS entre SP e o estado de destino para óleos lubrificantes.' },
    ],
  },

  // ── NF-e CONSERTO ──
  'conserto': {
    label: 'NF-e — Conserto',
    emoji: '⚙️',
    tipo: 'NF-e (par)',
    desc: 'Par de NF-e: remessa do cliente para conserto + retorno emitido pela Gera Vale. Não gera faturamento — apenas movimentação física.',
    steps: [
      'Registrar NF de remessa do cliente no Omie (CFOP 1.915 ou 2.915)',
      'Executar o serviço de conserto',
      'Gerar NF de retorno a partir da nota de entrada no Omie',
      'Verificar valores e NCM antes de transmitir o retorno',
    ],
    fields: [
      ['Tipo nota', 'NF-e produto (par)', 'fixo'],
      ['Produto Omie', 'SCRKR — SECADOR', 'fixo', 'Nunca cadastrar produto novo'],
      ['NCM remessa', 'Conforme cliente', 'conferir', 'Verificar NCM na NF do cliente; ajustar SCRKR se diferente de 8419.39.00'],
      ['CFOP remessa (SP)', '5.915 (cliente) / 1.915 (GV entrada)', 'fixo'],
      ['CFOP remessa (outro estado)', '6.915 (cliente) / 2.915 (GV entrada)', 'fixo'],
      ['Local estoque', 'E.MOV', 'fixo', 'Estoque de movimento para conserto'],
      ['Gera cta. a pagar?', 'Não', 'fixo', 'Marcar "não gera conta a pagar" no Omie'],
      ['Movimenta estoque?', 'Não', 'fixo', 'Desmarcado no Omie (não movimenta financeiro)'],
      ['CFOP retorno (SP)', '5.916', 'fixo', 'Retorno intraestadual SP'],
      ['CFOP retorno (outro est.)', '6.916', 'fixo', 'Retorno interestadual'],
      ['ICMS CST retorno', '41', 'fixo', 'Não tributado — art. 7º IX RICMS/SP'],
      ['Valores retorno', 'Idênticos à remessa', 'fixo', 'Omie espelha automaticamente ao gerar retorno'],
      ['CNPJ destinatário', 'CNPJ do cliente remetente', 'conferir', 'Verificar preenchimento automático do Omie'],
      ['Loc. estoque saída', 'E.MOV', 'fixo', 'Saída do estoque de movimento'],
      ['Loc. estoque saída (entrada)', '(em branco)', 'fixo', 'Campo saída vazio na NF de entrada'],
    ],
    alerts: [
      { type: 'error', msg: 'Se o NCM do equipamento for diferente de 8419.39.00: altere o NCM do produto SCRKR temporariamente, emita o retorno e restaure imediatamente. Nunca deixe o NCM errado permanentemente.' },
      { type: 'ok', msg: 'Gerar NF de retorno pelo botão "Gerar NF de Retorno" na nota de entrada do Omie — não criar manualmente.' },
    ],
  },

  // ── NF-e IMPORTADO ──
  'imp-revenda': {
    label: 'Importado — Revenda / Industrialização',
    emoji: '📦',
    tipo: 'NF-e',
    desc: 'Equipamento importado vendido para cliente que vai revender ou usar na produção. Consumidor Final = NÃO.',
    steps: [
      'Confirmar com o cliente o destino da mercadoria (revenda ou produção)',
      'Marcar Consumidor Final = NÃO no Omie',
      'Base ICMS = valor produtos apenas (sem IPI)',
      'Verificar alíquota IPI na TIPI pelo NCM',
    ],
    fields: [
      ['Tipo nota', 'NF-e produto', 'fixo'],
      ['CFOP', '6.102', 'fixo', 'Venda interestadual — revenda/industrialização'],
      ['Nat. Operação', 'Venda de mercadoria', 'fixo'],
      ['NCM', 'Conforme produto', 'variavel', 'Verificar NCM na ficha técnica do equipamento'],
      ['Origem', '1', 'fixo', 'Estrangeiro — importação direta pela GV'],
      ['Consumidor Final', 'NÃO', 'fixo', 'Campo obrigatório — impacta base ICMS e DIFAL'],
      ['CST ICMS', '100 (origem 1 + CST 00)', 'fixo', 'Produto importado + tributação normal'],
      ['ICMS', '4%', 'fixo', 'Interestadual produto importado — Res. Senado 13/2012'],
      ['Base ICMS', 'Somente vProd', 'fixo', 'IPI não integra base (CF art. 155 §2º XI)'],
      ['DIFAL', 'Não aplicável', 'fixo', 'Sem DIFAL para revenda/industrialização'],
      ['IPI CST', '50', 'fixo', 'Saída tributada — GV equiparada a indústria (RIPI art. 9º I)'],
      ['Alíq. IPI', 'Conforme TIPI', 'conferir', 'Verificar alíquota pelo NCM na tabela TIPI vigente'],
      ['Base IPI', 'vProd', 'fixo', 'IPI não acumula com ele mesmo'],
      ['PIS', '1,65% — CST 01', 'fixo'],
      ['COFINS', '7,60% — CST 01', 'fixo'],
      ['Base PIS/COFINS', 'vProd − ICMS próprio', 'fixo', 'IPI nunca entra na base PIS/COFINS'],
      ['IBS', '0,10% — CST 000 / cClassTrib 000001', 'fixo'],
      ['CBS', '0,90% — CST 000 / cClassTrib 000001', 'fixo'],
    ],
    alerts: [
      { type: 'error', msg: 'Erro NF 3.594 (Fiedler/SC): consumidor final marcado como SIM quando deveria ser NÃO. A base ICMS foi calculada com IPI incluído (R$5.500 vs correto R$5.000). Conferir este campo antes de transmitir.' },
    ],
  },
  'imp-consumo': {
    label: 'Importado — Uso e Consumo / Ativo',
    emoji: '📦',
    tipo: 'NF-e',
    desc: 'Equipamento importado vendido para cliente que vai usar internamente (ativo imobilizado ou consumo). Consumidor Final = SIM. DIFAL incide.',
    steps: [
      'Confirmar com o cliente que o equipamento é para uso próprio',
      'Marcar Consumidor Final = SIM no Omie',
      'Base ICMS = vProd + IPI (consumidor final)',
      'Informar ao cliente que o DIFAL é responsabilidade dele no estado de destino',
    ],
    fields: [
      ['Tipo nota', 'NF-e produto', 'fixo'],
      ['CFOP', '6.102', 'fixo', 'DIFAL de responsabilidade do comprador no estado de destino'],
      ['NCM', 'Conforme produto', 'variavel'],
      ['Origem', '1', 'fixo'],
      ['Consumidor Final', 'SIM', 'fixo', 'Campo obrigatório — muda base ICMS e gera DIFAL'],
      ['CST ICMS', '100 (origem 1 + CST 00)', 'fixo'],
      ['ICMS', '4%', 'fixo'],
      ['Base ICMS', 'vProd + IPI', 'fixo', 'Quando consumidor final, IPI integra a base ICMS'],
      ['DIFAL', 'Responsabilidade do comprador', 'fixo', 'GV emite com CFOP 6.102; comprador recolhe DIFAL no estado dele'],
      ['IPI CST', '50', 'fixo'],
      ['Alíq. IPI', 'Conforme TIPI', 'conferir'],
      ['Base IPI', 'vProd', 'fixo'],
      ['PIS', '1,65% — CST 01', 'fixo'],
      ['COFINS', '7,60% — CST 01', 'fixo'],
      ['Base PIS/COFINS', 'vProd − ICMS próprio', 'fixo', 'IPI nunca na base PIS/COFINS'],
      ['IBS', '0,10% — CST 000 / cClassTrib 000001', 'fixo'],
      ['CBS', '0,90% — CST 000 / cClassTrib 000001', 'fixo'],
    ],
    alerts: [
      { type: 'warning', msg: 'Confirmar com o cliente que ele tem ciência do DIFAL a recolher no estado de destino. A GV não é responsável pelo DIFAL nesta situação.' },
    ],
  },
}

// ── Árvore de decisão ─────────────────────────────────────────────────────────
const TREE = [
  {
    id: 'srv',
    label: 'Serviço',
    emoji: '🔧',
    color: 'var(--blue)',
    children: [
      { id: 'srv-oficina', label: 'Avulso — Oficina GV', emoji: '🏭', desc: 'Máquina vem até a GV' },
      { id: 'srv-cliente', label: 'Avulso — No cliente', emoji: '🚗', desc: 'Técnico vai ao cliente' },
      { id: 'srv-contrato', label: 'Contrato mensal', emoji: '📋', desc: 'Faturamento recorrente' },
    ],
  },
  {
    id: 'prod',
    label: 'NF-e Produto',
    emoji: '📦',
    color: 'var(--orange)',
    children: [
      {
        id: 'oleo',
        label: 'Óleo lubrificante',
        emoji: '🛢️',
        desc: 'Kaeser Fluid S / lubrificantes importados',
        children: [
          { id: 'oleo-sp', label: 'Destino SP', emoji: '📍', desc: 'ST já recolhida — CST 60' },
          { id: 'oleo-pe', label: 'Destino PE', emoji: '📍', desc: 'ST manual — fórmula específica' },
          { id: 'oleo-es', label: 'Destino ES', emoji: '📍', desc: 'ST Omie — fórmula genérica' },
          { id: 'oleo-outro', label: 'Outro estado', emoji: '📍', desc: 'Verificar protocolo' },
        ],
      },
      { id: 'conserto', label: 'Conserto', emoji: '⚙️', desc: 'Par remessa + retorno' },
      {
        id: 'imp',
        label: 'Importado',
        emoji: '🌎',
        desc: 'Origem 1 — equipamentos Kaeser',
        children: [
          { id: 'imp-revenda', label: 'Revenda / industrialização', emoji: '🏭', desc: 'Consumidor final: NÃO' },
          { id: 'imp-consumo', label: 'Uso e consumo / ativo', emoji: '🏢', desc: 'Consumidor final: SIM' },
        ],
      },
    ],
  },
]

// ── Componente de cartão cenário ──────────────────────────────────────────────
function CenarioCard({ id }) {
  const c = CENARIOS[id]
  if (!c) return null
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>{c.emoji}</span>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{c.label}</h2>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: c.tipo.startsWith('NFS') ? '#1a2e4a' : '#2a1e3a', color: c.tipo.startsWith('NFS') ? '#6cb6ff' : '#c9b1e8' }}>{c.tipo}</span>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>{c.desc}</p>
      </div>

      {c.steps.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 6 }}>Passos</div>
          {c.steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12, color: 'var(--text-2)' }}>
              <span style={{ minWidth: 18, height: 18, background: 'var(--bg-3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text)', flexShrink: 0, fontWeight: 600 }}>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
      )}

      {c.alerts.map((a, i) => (
        <Alert key={i} type={a.type}>{a.msg}</Alert>
      ))}

      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 6, marginTop: 4 }}>Campos Omie</div>
      <Fields rows={c.fields} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, fontSize: 11 }}>
        {Object.entries(tagStyle).map(([k, v]) => (
          <span key={k} style={{ padding: '2px 8px', borderRadius: 10, background: v.bg, color: v.color, fontWeight: 600, fontSize: 10 }}>{v.label}</span>
        ))}
        <span style={{ color: 'var(--text-3)', marginLeft: 4 }}>— legenda dos campos</span>
      </div>
    </div>
  )
}

// ── Nó da árvore ──────────────────────────────────────────────────────────────
function TreeNode({ node, depth = 0, onSelect, selected }) {
  const [open, setOpen] = useState(depth < 1)
  const isLeaf = CENARIOS[node.id]
  const isSelected = selected === node.id

  if (isLeaf) {
    return (
      <button
        onClick={() => onSelect(node.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left',
          padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: isSelected ? 'var(--bg-3)' : 'transparent',
          color: isSelected ? 'var(--text)' : 'var(--text-2)',
          fontSize: 12, fontWeight: isSelected ? 600 : 400,
          marginLeft: depth * 14,
          transition: 'background .15s',
        }}
      >
        <span style={{ fontSize: 14 }}>{node.emoji}</span>
        <div>
          <div>{node.label}</div>
          {node.desc && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{node.desc}</div>}
        </div>
        {isSelected && <span style={{ marginLeft: 'auto', color: 'var(--blue)', fontSize: 10 }}>◀</span>}
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left',
          padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: 'transparent', color: 'var(--text)', fontSize: 12, fontWeight: 600,
          marginLeft: depth * 14,
        }}
      >
        <span style={{ fontSize: 14 }}>{node.emoji}</span>
        <span style={{ flex: 1 }}>{node.label}</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)', transition: 'transform .2s', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
      </button>
      {open && (
        <div>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} selected={selected} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Fluxo() {
  const [selected, setSelected] = useState('srv-oficina')

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav crumbs={[{ label: 'Fluxo Fiscal' }]} />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Fluxo Fiscal</h1>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
            Selecione o tipo de operação para ver todos os campos do Omie com orientações de preenchimento
          </p>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Sidebar árvore */}
          <div style={{ width: 220, flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: 24, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', padding: '4px 10px 8px' }}>Operação</div>
              {TREE.map(node => (
                <TreeNode key={node.id} node={node} onSelect={setSelected} selected={selected} />
              ))}
            </div>
          </div>

          {/* Painel de campos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <CenarioCard id={selected} />
          </div>
        </div>
      </div>
    </div>
  )
}
