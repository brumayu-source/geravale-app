import React, { useState } from 'react'
import Nav from '../components/Nav'

// ── Árvore de decisões ────────────────────────────────────────────────────────
const ARVORE = {
  inicio: {
    id: 'inicio',
    pergunta: 'Qual é a natureza da operação?',
    subtitulo: 'O primeiro passo é identificar o que a Gera Vale está fazendo nessa nota.',
    opcoes: [
      { label: '🔧 Serviço de manutenção / reparo', icone: '🔧', next: 'serv_destino' },
      { label: '🛢️ Venda de óleo lubrificante', icone: '🛢️', next: 'oleo_destino' },
      { label: '🔩 Venda de peças / filtros', icone: '🔩', next: 'pecas_destino' },
      { label: '📦 Conserto de equipamento do cliente', icone: '📦', next: 'conserto_direcao' },
      { label: '🌐 Produto importado', icone: '🌐', next: 'importado_uso' },
    ],
  },
  serv_destino: {
    id: 'serv_destino',
    pergunta: 'Onde o serviço foi prestado?',
    subtitulo: 'O local de prestação do serviço define o indicador (cIndOp) da NFS-e.',
    opcoes: [
      { label: '🏭 Na oficina da Gera Vale (SJC)', icone: '🏭', next: 'serv_tipo' },
      { label: '📍 No endereço do cliente', icone: '📍', next: 'serv_cliente_tipo' },
    ],
  },
  serv_tipo: {
    id: 'serv_tipo',
    pergunta: 'Qual é o tipo de serviço contratado?',
    subtitulo: 'Define o código de tributação nacional (cTribNac).',
    opcoes: [
      { label: '🛠️ Manutenção / reparo técnico', icone: '🛠️', next: 'resultado_nfse_manutencao' },
      { label: '💼 Comissão de representação (Kaeser)', icone: '💼', next: 'resultado_nfse_comissao' },
    ],
  },
  serv_cliente_tipo: {
    id: 'serv_cliente_tipo',
    pergunta: 'Qual é o tipo de serviço no cliente?',
    opcoes: [
      { label: '🛠️ Manutenção / reparo técnico', icone: '🛠️', next: 'resultado_nfse_cliente' },
      { label: '💼 Comissão de representação (Kaeser)', icone: '💼', next: 'resultado_nfse_comissao' },
    ],
  },
  oleo_destino: {
    id: 'oleo_destino',
    pergunta: 'O cliente está em qual estado?',
    subtitulo: 'O estado de destino define o CFOP e as alíquotas de ICMS / ICMS-ST.',
    opcoes: [
      { label: '🏠 São Paulo (SP)', icone: '🏠', next: 'resultado_oleo_sp' },
      { label: '🏭 Pernambuco (PE)', icone: '🏭', next: 'resultado_oleo_pe' },
      { label: '🌊 Espírito Santo (ES)', icone: '🌊', next: 'resultado_oleo_es' },
      { label: '📦 Outro estado', icone: '📦', next: 'oleo_entrega_futura' },
    ],
  },
  oleo_entrega_futura: {
    id: 'oleo_entrega_futura',
    pergunta: 'É uma venda normal ou entrega futura de saldo pendente?',
    subtitulo: 'A entrega futura usa CFOP e tratamento de ICMS diferente.',
    opcoes: [
      { label: '🛒 Venda normal (outro estado)', icone: '🛒', next: 'resultado_oleo_outro' },
      { label: '📋 Remessa complementar / entrega futura', icone: '📋', next: 'resultado_oleo_remessa' },
    ],
  },
  pecas_destino: {
    id: 'pecas_destino',
    pergunta: 'O cliente está em qual estado?',
    subtitulo: 'Define o CFOP: 5102 dentro de SP, 6102 para outros estados.',
    opcoes: [
      { label: '🏠 São Paulo (SP)', icone: '🏠', next: 'resultado_pecas_sp' },
      { label: '🌍 Outro estado', icone: '🌍', next: 'resultado_pecas_outro' },
    ],
  },
  conserto_direcao: {
    id: 'conserto_direcao',
    pergunta: 'Em que sentido o equipamento está indo?',
    subtitulo: 'Remessa = equipamento indo para a oficina. Retorno = voltando ao cliente.',
    opcoes: [
      { label: '➡️ Remessa — equipamento indo para a Gera Vale', icone: '➡️', next: 'resultado_conserto_remessa' },
      { label: '⬅️ Retorno — equipamento voltando ao cliente', icone: '⬅️', next: 'resultado_conserto_retorno' },
    ],
  },
  importado_uso: {
    id: 'importado_uso',
    pergunta: 'O produto importado vai ser revendido ou usado internamente?',
    subtitulo: 'Define o CFOP e o tratamento tributário.',
    opcoes: [
      { label: '🛒 Revenda (com ICMS-ST)', icone: '🛒', next: 'resultado_importado_revenda' },
      { label: '🏭 Uso e consumo próprio (sem ST)', icone: '🏭', next: 'resultado_importado_consumo' },
    ],
  },
}

const RESULTADOS = {
  resultado_nfse_manutencao: {
    titulo: 'NFS-e · Manutenção na oficina',
    cor: '#3B82F6',
    icone: '🛠️',
    resumo: 'Serviço de manutenção prestado na oficina da Gera Vale em São José dos Campos.',
    secoes: [
      {
        titulo: 'Documento fiscal',
        items: [
          { label: 'Tipo', valor: 'NFS-e Nacional (DPS)', tipo: 'ok' },
          { label: 'cIndOp', valor: '050101 — serviço prestado nas dependências do prestador', tipo: 'ok' },
          { label: 'cTribNac', valor: '140101 — Manutenção e reparação de máquinas e equipamentos', tipo: 'ok' },
          { label: 'cTribMun', valor: '0068 (código ISS — SJC)', tipo: 'ok' },
          { label: 'cNBS', valor: '1.2001.50.00', tipo: 'ok' },
          { label: 'cLocPrestacao', valor: '3549904 (IBGE São José dos Campos)', tipo: 'ok' },
        ],
      },
      {
        titulo: 'ISS',
        items: [
          { label: 'Alíquota', valor: '3%', tipo: 'ok' },
          { label: 'Retenção', valor: 'Apenas se o tomador for PJ fora do Simples Nacional e nota ≥ R$ 215,06', tipo: 'aviso' },
        ],
      },
      {
        titulo: 'PIS / COFINS',
        items: [
          { label: 'CST PIS e COFINS', valor: '01 (cumulativo — Lucro Presumido)', tipo: 'ok' },
          { label: 'Alíquota PIS', valor: '0,65%', tipo: 'ok' },
          { label: 'Alíquota COFINS', valor: '3,00%', tipo: 'ok' },
          { label: 'Retenção 4,65%', valor: 'Se tomador PJ fora do Simples e nota ≥ R$ 215,06', tipo: 'aviso' },
        ],
      },
      {
        titulo: 'IBS / CBS (Reforma Tributária)',
        items: [
          { label: 'CST IBS/CBS', valor: '000 — tributação integral', tipo: 'ok' },
          { label: 'cClassTrib', valor: '000001', tipo: 'ok' },
        ],
      },
    ],
    alerta: null,
  },
  resultado_nfse_cliente: {
    titulo: 'NFS-e · Manutenção no cliente',
    cor: '#3B82F6',
    icone: '📍',
    resumo: 'Serviço de manutenção prestado no endereço do tomador (cliente).',
    secoes: [
      {
        titulo: 'Documento fiscal',
        items: [
          { label: 'Tipo', valor: 'NFS-e Nacional (DPS)', tipo: 'ok' },
          { label: 'cIndOp', valor: '050102 — serviço prestado nas dependências do tomador', tipo: 'ok' },
          { label: 'cTribNac', valor: '140101', tipo: 'ok' },
          { label: 'cTribMun', valor: '0068', tipo: 'ok' },
          { label: 'cNBS', valor: '1.2001.50.00', tipo: 'ok' },
          { label: 'cLocPrestacao', valor: 'IBGE da cidade do cliente', tipo: 'aviso' },
        ],
      },
      {
        titulo: 'ISS',
        items: [
          { label: 'Alíquota', valor: '3% (alíquota de SJC — prestador é SJC)', tipo: 'ok' },
          { label: 'Local de recolhimento', valor: 'Depende de convênio municipal', tipo: 'aviso' },
        ],
      },
      {
        titulo: 'PIS / COFINS',
        items: [
          { label: 'CST PIS e COFINS', valor: '01', tipo: 'ok' },
          { label: 'Alíquota PIS / COFINS', valor: '0,65% / 3,00%', tipo: 'ok' },
        ],
      },
    ],
    alerta: 'Quando o serviço é prestado no endereço do cliente, use cIndOp 050102 (não 050101). Se a cidade for diferente de SJC, o local de prestação muda — confirme com o fiscal.',
  },
  resultado_nfse_comissao: {
    titulo: 'NFS-e · Comissão de representação Kaeser',
    cor: '#7C3AED',
    icone: '💼',
    resumo: 'Nota de serviço referente à comissão recebida pela Gera Vale como representante Kaeser.',
    secoes: [
      {
        titulo: 'Documento fiscal',
        items: [
          { label: 'Tipo', valor: 'NFS-e Nacional (DPS)', tipo: 'ok' },
          { label: 'cIndOp', valor: '100301 — comissão de representação comercial', tipo: 'ok' },
          { label: 'cTribNac', valor: '100901 — Comissão e representação comercial', tipo: 'ok' },
          { label: 'cTribMun', valor: '0068', tipo: 'ok' },
        ],
      },
      {
        titulo: 'ISS',
        items: [
          { label: 'Alíquota', valor: '3%', tipo: 'ok' },
          { label: 'Retenção ISS', valor: 'Verificar cláusula contratual com Kaeser', tipo: 'aviso' },
        ],
      },
      {
        titulo: 'PIS / COFINS',
        items: [
          { label: 'CST', valor: '01', tipo: 'ok' },
          { label: 'Alíquotas', valor: '0,65% PIS / 3,00% COFINS', tipo: 'ok' },
        ],
      },
    ],
    alerta: 'O código 100901 é exclusivo para comissão. Nunca use 140101 nessa nota — misturar os dois códigos distorce os relatórios de serviços prestados.',
  },
  resultado_oleo_sp: {
    titulo: 'NF-e · Óleo lubrificante — dentro de SP',
    cor: '#F97316',
    icone: '🛢️',
    resumo: 'Venda de óleo ANS460 Kaeser para cliente dentro do estado de São Paulo.',
    secoes: [
      {
        titulo: 'NF-e',
        items: [
          { label: 'CFOP', valor: '5405 — venda de produto sujeito a ST (dentro de SP)', tipo: 'ok' },
          { label: 'NCM', valor: '3403.99.00', tipo: 'ok' },
          { label: 'CEST', valor: '06.017.00', tipo: 'ok' },
          { label: 'Origem', valor: '2 — estrangeiro, procedência conhecida', tipo: 'ok' },
          { label: 'CST ICMS', valor: '060 — ST recolhida anteriormente', tipo: 'ok' },
          { label: 'ICMS na nota', valor: 'R$ 0,00 — ST já recolhida na entrada', tipo: 'ok' },
        ],
      },
      {
        titulo: 'PIS / COFINS',
        items: [
          { label: 'Base', valor: 'vProd − vICMS (dedução do ICMS próprio)', tipo: 'ok' },
          { label: 'Alíquota PIS', valor: '0,65%', tipo: 'ok' },
          { label: 'Alíquota COFINS', valor: '3,00%', tipo: 'ok' },
        ],
      },
    ],
    alerta: null,
  },
  resultado_oleo_pe: {
    titulo: 'NF-e · Óleo lubrificante — Pernambuco (PE)',
    cor: '#F97316',
    icone: '🛢️',
    resumo: 'Venda de óleo para cliente em PE. ICMS interestadual 4% + ST para PE.',
    secoes: [
      {
        titulo: 'NF-e',
        items: [
          { label: 'CFOP', valor: '6403 — venda interestadual com ST', tipo: 'ok' },
          { label: 'NCM', valor: '3403.99.00', tipo: 'ok' },
          { label: 'CEST', valor: '06.017.00', tipo: 'ok' },
          { label: 'Origem', valor: '2 — estrangeiro, procedência conhecida', tipo: 'ok' },
          { label: 'ICMS interestadual', valor: '4% (produto de origem estrangeira, orig 2)', tipo: 'ok' },
          { label: 'ICMS-ST PE', valor: 'Alíquota interna PE (~20,5%) − ICMS próprio 4%', tipo: 'ok' },
        ],
      },
      {
        titulo: 'GNRE',
        items: [
          { label: 'Obrigação', valor: 'Emitir GNRE para PE antes da saída', tipo: 'erro' },
          { label: 'Prazo', valor: 'Antes da saída da mercadoria do estabelecimento', tipo: 'aviso' },
        ],
      },
    ],
    alerta: 'Emita a GNRE de ICMS-ST para Pernambuco após autorizar a nota e antes de despachar o produto. Sem GNRE, a mercadoria pode ser retida no posto fiscal.',
  },
  resultado_oleo_es: {
    titulo: 'NF-e · Óleo lubrificante — Espírito Santo (ES)',
    cor: '#F97316',
    icone: '🛢️',
    resumo: 'Venda de óleo para cliente em ES. ICMS interestadual 4% + ST para ES.',
    secoes: [
      {
        titulo: 'NF-e',
        items: [
          { label: 'CFOP', valor: '6403 — venda interestadual com ST', tipo: 'ok' },
          { label: 'NCM', valor: '3403.99.00', tipo: 'ok' },
          { label: 'CEST', valor: '06.017.00', tipo: 'ok' },
          { label: 'Origem', valor: '2 — estrangeiro', tipo: 'ok' },
          { label: 'ICMS', valor: '4% (interestadual, origem 2)', tipo: 'ok' },
          { label: 'ICMS-ST ES', valor: 'Alíquota interna ES (~17%) − ICMS próprio 4%', tipo: 'ok' },
        ],
      },
      {
        titulo: 'GNRE',
        items: [
          { label: 'Obrigação', valor: 'Emitir GNRE para ES', tipo: 'erro' },
        ],
      },
    ],
    alerta: null,
  },
  resultado_oleo_outro: {
    titulo: 'NF-e · Óleo lubrificante — outro estado',
    cor: '#F97316',
    icone: '🛢️',
    resumo: 'Venda interestadual de óleo para estado sem protocolo específico. CFOP 6403.',
    secoes: [
      {
        titulo: 'NF-e',
        items: [
          { label: 'CFOP', valor: '6403 — venda interestadual com ST', tipo: 'ok' },
          { label: 'NCM', valor: '3403.99.00', tipo: 'ok' },
          { label: 'Origem', valor: '2', tipo: 'ok' },
          { label: 'ICMS', valor: '4%', tipo: 'ok' },
          { label: 'ICMS-ST', valor: 'Calcular conforme protocolo do estado destino', tipo: 'aviso' },
        ],
      },
    ],
    alerta: 'Para estados sem protocolo ICMS-ST firmado com SP (além de PE e ES), verifique com o fiscal se há ST antes de emitir. O Omie pode não calcular automaticamente.',
  },
  resultado_oleo_remessa: {
    titulo: 'NF-e · Óleo — Remessa futura / entrega complementar',
    cor: '#0D9488',
    icone: '📋',
    resumo: 'Entrega parcial de óleo referente a venda já faturada anteriormente. O ICMS foi recolhido na nota de origem.',
    secoes: [
      {
        titulo: 'NF-e',
        items: [
          { label: 'CFOP', valor: '6117 — remessa de mercadoria para entrega futura', tipo: 'ok' },
          { label: 'NCM', valor: '3403.99.00', tipo: 'ok' },
          { label: 'CST ICMS', valor: '041 — monofásico, não incidência', tipo: 'ok' },
          { label: 'ICMS', valor: 'R$ 0,00 — imposto já recolhido na NF de origem', tipo: 'ok' },
          { label: 'ICMS-ST', valor: 'R$ 0,00', tipo: 'ok' },
        ],
      },
      {
        titulo: 'Referência à NF de origem',
        items: [
          { label: 'Campo NFref', valor: 'Obrigatório — referenciar a NF do faturamento original', tipo: 'erro' },
          { label: 'Fundamento legal', valor: 'Art. 7º, XIV, RICMS/SP (Decreto 45.490/2000)', tipo: 'aviso' },
        ],
      },
    ],
    alerta: 'Sem a referência à NF de origem (campo NFref), a nota pode ser rejeitada. O ICMS é zero porque já foi recolhido integralmente na nota de faturamento original.',
  },
  resultado_pecas_sp: {
    titulo: 'NF-e · Peças e filtros — dentro de SP',
    cor: '#7C3AED',
    icone: '🔩',
    resumo: 'Venda de filtros e peças Kaeser (NCM 8421) para cliente em SP.',
    secoes: [
      {
        titulo: 'NF-e',
        items: [
          { label: 'CFOP', valor: '5102 — venda de mercadoria adquirida ou recebida de terceiros', tipo: 'ok' },
          { label: 'NCM', valor: '8421.99.10 (filtros) ou 8421.99.99 (separadores)', tipo: 'ok' },
          { label: 'Origem', valor: '2 — estrangeiro, procedência conhecida', tipo: 'ok' },
          { label: 'CST ICMS', valor: '200 — origem 2, tributado normalmente', tipo: 'ok' },
          { label: 'ICMS-ST', valor: 'R$ 0,00 — NCM 8421 não tem ST', tipo: 'ok' },
        ],
      },
      {
        titulo: 'PIS / COFINS',
        items: [
          { label: 'CST', valor: '01', tipo: 'ok' },
          { label: 'Alíquotas', valor: '0,65% / 3,00%', tipo: 'ok' },
        ],
      },
    ],
    alerta: null,
  },
  resultado_pecas_outro: {
    titulo: 'NF-e · Peças e filtros — outro estado',
    cor: '#7C3AED',
    icone: '🔩',
    resumo: 'Venda interestadual de filtros e peças Kaeser. ICMS 4% (produto estrangeiro).',
    secoes: [
      {
        titulo: 'NF-e',
        items: [
          { label: 'CFOP', valor: '6102 — venda interestadual', tipo: 'ok' },
          { label: 'NCM', valor: '8421.99.10 / 8421.99.99', tipo: 'ok' },
          { label: 'Origem', valor: '2', tipo: 'ok' },
          { label: 'ICMS', valor: '4% (interestadual, origem 2)', tipo: 'ok' },
          { label: 'ICMS-ST', valor: 'R$ 0,00 — NCM 8421 sem substituição tributária', tipo: 'ok' },
        ],
      },
    ],
    alerta: null,
  },
  resultado_conserto_remessa: {
    titulo: 'NF-e · Conserto — Remessa do equipamento',
    cor: '#F59E0B',
    icone: '➡️',
    resumo: 'Equipamento do cliente sendo enviado para a oficina da Gera Vale. Não é venda — sem ICMS.',
    secoes: [
      {
        titulo: 'NF-e de remessa',
        items: [
          { label: 'CFOP SP', valor: '5915 — remessa de bem para conserto (dentro de SP)', tipo: 'ok' },
          { label: 'CFOP interestadual', valor: '6915 — remessa de bem para conserto (outro estado)', tipo: 'ok' },
          { label: 'ICMS', valor: 'R$ 0,00 — não é operação de venda', tipo: 'ok' },
          { label: 'ICMS-ST', valor: 'R$ 0,00', tipo: 'ok' },
        ],
      },
      {
        titulo: 'Registro no Omie',
        items: [
          { label: 'Produto', valor: 'Usar produto existente do SCRKR — nunca criar novo', tipo: 'erro' },
          { label: 'Estoque', valor: 'Local: E.MOV', tipo: 'aviso' },
          { label: 'Categoria', valor: '"Mercadoria recebida para conserto"', tipo: 'aviso' },
          { label: 'Conta', valor: 'Sem conta a pagar/receber', tipo: 'aviso' },
        ],
      },
      {
        titulo: 'Nota de retorno — emitir após o conserto',
        items: [
          { label: 'CFOP retorno SP', valor: '5916', tipo: 'ok' },
          { label: 'CFOP retorno interestadual', valor: '6916', tipo: 'ok' },
          { label: 'Itens', valor: 'Iguais à nota de remessa', tipo: 'ok' },
        ],
      },
    ],
    alerta: 'O par 5915+5916 (ou 6915+6916) é indivisível. Toda remessa deve ter um retorno correspondente. O Omie vincula automaticamente quando você usa o produto correto.',
  },
  resultado_conserto_retorno: {
    titulo: 'NF-e · Conserto — Retorno ao cliente',
    cor: '#F59E0B',
    icone: '⬅️',
    resumo: 'Equipamento consertado retornando ao cliente. Par complementar da nota de remessa.',
    secoes: [
      {
        titulo: 'NF-e de retorno',
        items: [
          { label: 'CFOP SP', valor: '5916 — retorno de bem recebido para conserto (SP)', tipo: 'ok' },
          { label: 'CFOP interestadual', valor: '6916 — retorno interestadual', tipo: 'ok' },
          { label: 'ICMS', valor: 'R$ 0,00 — não é venda', tipo: 'ok' },
          { label: 'Itens', valor: 'Iguais à nota de remessa correspondente', tipo: 'ok' },
        ],
      },
      {
        titulo: 'Vinculação',
        items: [
          { label: 'NFref', valor: 'Referenciar a NF de remessa (5915/6915)', tipo: 'aviso' },
          { label: 'Omie', valor: 'Emitir a partir da entrada de remessa cadastrada', tipo: 'aviso' },
        ],
      },
    ],
    alerta: null,
  },
  resultado_importado_revenda: {
    titulo: 'NF-e · Produto importado — Revenda',
    cor: '#0891B2',
    icone: '🛒',
    resumo: 'Produto importado sendo revendido. Incide ICMS normal + ICMS-ST.',
    secoes: [
      {
        titulo: 'NF-e',
        items: [
          { label: 'CFOP interestadual', valor: '6403 (com ST)', tipo: 'ok' },
          { label: 'Origem', valor: '8 — importação direta pelo próprio estabelecimento', tipo: 'ok' },
          { label: 'ICMS interestadual', valor: '4% (produto importado)', tipo: 'ok' },
          { label: 'ICMS-ST', valor: 'Calcular com MVA do produto e estado destino', tipo: 'aviso' },
        ],
      },
    ],
    alerta: 'Para produto de importação direta, origem = 8. Se importado por terceiro intermediário, origem = 9. A alíquota ICMS interestadual é sempre 4% para produtos sem produção nacional equivalente.',
  },
  resultado_importado_consumo: {
    titulo: 'NF-e · Produto importado — Uso e consumo',
    cor: '#0891B2',
    icone: '🏭',
    resumo: 'Produto importado para uso interno da Gera Vale. Sem ST — não há saída para revenda.',
    secoes: [
      {
        titulo: 'NF-e',
        items: [
          { label: 'CFOP', valor: '6102 (uso e consumo) ou conforme tipo de saída', tipo: 'aviso' },
          { label: 'Origem', valor: '8 ou 9 (conforme tipo de importação)', tipo: 'ok' },
          { label: 'ICMS', valor: '4% (interestadual, produto importado)', tipo: 'ok' },
          { label: 'ICMS-ST', valor: 'R$ 0,00 — uso e consumo não gera ST', tipo: 'ok' },
        ],
      },
    ],
    alerta: null,
  },
}

// ── Painel de resultado ────────────────────────────────────────────────────────
function PainelResultado({ resultado, onReset }) {
  const R = RESULTADOS[resultado]
  if (!R) return null

  const tipoCores = {
    ok:    { bg: 'var(--green-bg)',  icon: '✅' },
    aviso: { bg: 'var(--yellow-bg)', icon: '⚠️' },
    erro:  { bg: 'var(--red-bg)',    icon: '❌' },
  }

  return (
    <div style={{ animation: 'fadeIn .2s ease' }}>
      <div style={{
        padding: '16px 20px',
        background: `color-mix(in srgb, ${R.cor} 10%, white)`,
        border: `1px solid color-mix(in srgb, ${R.cor} 25%, #e5e7eb)`,
        borderLeft: `4px solid ${R.cor}`,
        borderRadius: 12, marginBottom: 16,
      }}>
        <div style={{ fontSize: 20, marginBottom: 6 }}>{R.icone}</div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{R.titulo}</h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{R.resumo}</p>
      </div>

      {R.alerta && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 14,
          background: 'var(--yellow-bg)', border: '1px solid #FDE68A',
          fontSize: 12, color: 'var(--text)', lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700 }}>⚠️ Atenção — </span>{R.alerta}
        </div>
      )}

      {R.secoes.map((sec, si) => (
        <div key={si} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-3)', marginBottom: 8 }}>
            {sec.titulo}
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {sec.items.map((item, ii) => {
              const cfg = tipoCores[item.tipo] || tipoCores.aviso
              return (
                <div key={ii} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px',
                  borderBottom: ii < sec.items.length - 1 ? '1px solid var(--border)' : 'none',
                  background: cfg.bg,
                }}>
                  <span style={{ fontSize: 12, marginTop: 1, flexShrink: 0 }}>{cfg.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginRight: 6 }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'DM Mono, monospace' }}>{item.valor}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onReset} style={{
          padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)',
          background: '#fff', fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500,
        }}>
          ↩ Consultar outro cenário
        </button>
        <a href="/conferidor" style={{
          padding: '10px 18px', borderRadius: 8,
          background: 'var(--gv-yellow)', border: '1px solid var(--gv-yellow-dk)',
          fontSize: 13, color: '#000', fontWeight: 600, textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          🔍 Conferir uma nota deste tipo
        </a>
      </div>
    </div>
  )
}

// ── Passo de decisão ──────────────────────────────────────────────────────────
function PassoDecisao({ no, onEscolha }) {
  const [hovered, setHovered] = useState(null)
  return (
    <div style={{ animation: 'fadeIn .2s ease' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>{no.pergunta}</h2>
      {no.subtitulo && (
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 18px', lineHeight: 1.5 }}>{no.subtitulo}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {no.opcoes.map((op, i) => (
          <button
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onEscolha(op)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 16px', borderRadius: 10, textAlign: 'left',
              border: `1.5px solid ${hovered === i ? 'var(--gv-yellow)' : 'var(--border)'}`,
              background: hovered === i ? 'var(--yellow-bg)' : '#fff',
              cursor: 'pointer', transition: 'all .15s', fontSize: 14, color: 'var(--text)',
              fontWeight: hovered === i ? 600 : 400,
              boxShadow: hovered === i ? '0 0 0 3px rgba(234,176,8,.15)' : 'none',
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{op.icone}</span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{op.label}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: hovered === i ? 1 : 0.3, flexShrink: 0 }}>
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Fluxo() {
  const [historico, setHistorico] = useState([])
  const [noAtual, setNoAtual] = useState('inicio')

  function escolher(opcao) {
    setHistorico(prev => [...prev, { noId: noAtual, escolha: opcao.label }])
    setNoAtual(opcao.next)
  }

  function voltarPara(idx) {
    setHistorico(prev => prev.slice(0, idx))
    setNoAtual(historico[idx]?.noId || 'inicio')
  }

  function resetar() {
    setHistorico([])
    setNoAtual('inicio')
  }

  const noObj = ARVORE[noAtual]
  const ehResultado = noAtual.startsWith('resultado_')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)' }}>
      <Nav />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Fluxo Fiscal</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '6px 0 0' }}>
            Responda as perguntas e descubra quais códigos e regras se aplicam à sua operação.
          </p>
        </div>

        {/* Breadcrumb de progresso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={resetar} style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: historico.length === 0 && !ehResultado ? 'var(--gv-yellow)' : 'var(--bg-3)',
            color: historico.length === 0 && !ehResultado ? '#000' : 'var(--text-3)',
            border: 'none', cursor: 'pointer',
          }}>Início</button>

          {historico.map((h, i) => (
            <React.Fragment key={i}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3 2l4 3-4 3" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <button onClick={() => voltarPara(i)} style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11,
                background: i === historico.length - 1 && !ehResultado ? 'var(--gv-yellow)' : 'var(--bg-3)',
                color: i === historico.length - 1 && !ehResultado ? '#000' : 'var(--text-2)',
                border: 'none', cursor: 'pointer', fontWeight: i === historico.length - 1 ? 600 : 400,
                maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={h.escolha}>
                {h.escolha.replace(/^[^\s]+\s/, '').split('—')[0].trim().slice(0, 24)}
              </button>
            </React.Fragment>
          ))}

          {ehResultado && (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M3 2l4 3-4 3" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'var(--gv-yellow)', color: '#000' }}>
                Resultado
              </span>
            </>
          )}
        </div>

        {/* Conteúdo principal */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px' }}>
          {ehResultado ? (
            <PainelResultado resultado={noAtual} onReset={resetar} />
          ) : noObj ? (
            <PassoDecisao no={noObj} onEscolha={escolher} />
          ) : (
            <div style={{ color: 'var(--text-3)', fontSize: 13 }}>
              Fluxo não encontrado. <button onClick={resetar} style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>Recomeçar</button>
            </div>
          )}
        </div>

        {!ehResultado && historico.length === 0 && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-3)', borderRadius: 8, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-2)' }}>Como funciona:</strong> Escolha a natureza da operação e responda as perguntas.
            O Fluxo Fiscal identifica os códigos corretos (CFOP, cTribNac, CST, etc.) e as obrigações acessórias para cada cenário da Gera Vale.
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}
