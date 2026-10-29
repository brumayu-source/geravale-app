import React, { useState, useRef } from 'react'
import Nav from '../components/Nav'

// ── Constantes ────────────────────────────────────────────────────────────────
const GV_CNPJ = '19090416000176'
const SJC_IBGE = '3549904'

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTag(node, tag) {
  if (!node) return ''
  const els = node.getElementsByTagName(tag)
  return els.length > 0 ? els[0].textContent.trim() : ''
}
function getAllTags(node, tag) {
  return Array.from(node.getElementsByTagName(tag))
}
function parseCNPJ(s) { return (s || '').replace(/\D/g, '') }
function fmtMoeda(v) {
  const n = parseFloat(v) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtNum(v, dec = 2) {
  return (parseFloat(v) || 0).toFixed(dec).replace('.', ',')
}
function fmtCNPJ(s) {
  const c = (s || '').replace(/\D/g, '')
  if (c.length !== 14) return s || '—'
  return `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12)}`
}
function normCFOP(c) { return (c || '').replace('.', '') }

// ── Extractor XML NFS-e ────────────────────────────────────────────────────────
function parseNFSe(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const infDPS = doc.getElementsByTagName('infDPS')[0]
  if (!infDPS) throw new Error('Não é uma NFS-e válida (infDPS não encontrado)')

  const toma = doc.getElementsByTagName('toma')[0]
  const serv = doc.getElementsByTagName('serv')[0]
  const tribut = doc.getElementsByTagName('tribut')[0]
  const totTrib = doc.getElementsByTagName('totTrib')[0]

  const vServ = parseFloat(getTag(infDPS, 'vServPrest') || getTag(infDPS, 'vServ') || '0')
  const tribTot = totTrib || tribut
  const vISS = parseFloat(getTag(tribTot || doc, 'vISS') || '0')
  const pAliqAplic = parseFloat(getTag(tribTot || doc, 'pAliqAplic') || getTag(tribTot || doc, 'pAliq') || '0')

  return {
    tipo: 'nfse',
    cNF: getTag(infDPS, 'cNF') || getTag(doc, 'nNFS') || getTag(doc, 'nDPS'),
    cTribNac: getTag(serv || doc, 'cTribNac'),
    cTribMun: getTag(serv || doc, 'cTribMun'),
    cNBS: getTag(serv || doc, 'cNBS'),
    cIndOp: getTag(serv || doc, 'cIndOp'),
    cLocPrestacao: getTag(serv || doc, 'cLocPrestacao') || getTag(doc, 'cLocPrestIBGE'),
    vServ,
    vISS,
    pAliqISS: pAliqAplic,
    tpRetISSQN: getTag(tribut || doc, 'tpRetISSQN'),
    CST_PIS: getTag(doc, 'CSTPIS') || getTag(doc, 'cstPIS'),
    pPIS: parseFloat(getTag(doc, 'pPIS') || '0'),
    vPIS: parseFloat(getTag(doc, 'vPIS') || '0'),
    CST_COFINS: getTag(doc, 'CSTCOFINS') || getTag(doc, 'cstCOFINS'),
    pCOFINS: parseFloat(getTag(doc, 'pCOFINS') || '0'),
    vCOFINS: parseFloat(getTag(doc, 'vCOFINS') || '0'),
    tpRetPisCofins: getTag(doc, 'tpRetPisCofins'),
    vIBS: parseFloat(getTag(doc, 'vIBS') || '0'),
    vCBS: parseFloat(getTag(doc, 'vCBS') || '0'),
    CST_IBS: getTag(doc, 'CSTibs') || getTag(doc, 'cstIBS'),
    cClassTrib: getTag(doc, 'cClassTrib'),
    cnpjPrestador: parseCNPJ(getTag(doc, 'CNPJ')),
    cnpjTomador: parseCNPJ(getTag(toma || doc, 'CNPJ')),
    raw: doc,
  }
}

// ── Extractor XML NF-e ────────────────────────────────────────────────────────
function parseNFe(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const infNFe = doc.getElementsByTagName('infNFe')[0]
  if (!infNFe) throw new Error('Não é uma NF-e válida (infNFe não encontrado)')

  const ide = doc.getElementsByTagName('ide')[0]
  const emit = doc.getElementsByTagName('emit')[0]
  const dest = doc.getElementsByTagName('dest')[0]
  const total = doc.getElementsByTagName('ICMSTot')[0]

  const dets = getAllTags(doc, 'det')
  const itens = dets.map(det => {
    const prod = det.getElementsByTagName('prod')[0]
    const imposto = det.getElementsByTagName('imposto')[0]
    const icms = imposto ? (imposto.getElementsByTagName('ICMS')[0] || imposto.getElementsByTagName('ICMSST')[0]) : null
    const icmsGrupo = icms ? icms.children[0] : null
    const pisDet = imposto ? imposto.getElementsByTagName('PIS')[0] : null
    const cofinsDet = imposto ? imposto.getElementsByTagName('COFINS')[0] : null
    return {
      nItem: det.getAttribute('nItem'),
      cProd: getTag(prod, 'cProd'),
      xProd: getTag(prod, 'xProd'),
      NCM: getTag(prod, 'NCM'),
      CEST: getTag(prod, 'CEST'),
      CFOP: getTag(prod, 'CFOP'),
      orig: getTag(icmsGrupo, 'orig'),
      CST_ICMS: getTag(icmsGrupo, 'CST'),
      pICMS: parseFloat(getTag(icmsGrupo, 'pICMS') || '0'),
      vICMS: parseFloat(getTag(icmsGrupo, 'vICMS') || '0'),
      pICMSST: parseFloat(getTag(icmsGrupo, 'pICMSST') || getTag(det, 'pICMSST') || '0'),
      vICMSST: parseFloat(getTag(icmsGrupo, 'vICMSST') || getTag(det, 'vICMSST') || '0'),
      vProd: parseFloat(getTag(prod, 'vProd') || '0'),
      vPIS: parseFloat(getTag(pisDet, 'vPIS') || '0'),
      vCOFINS: parseFloat(getTag(cofinsDet, 'vCOFINS') || '0'),
      CST_PIS: getTag(pisDet, 'CST'),
      pPIS: parseFloat(getTag(pisDet, 'pPIS') || '0'),
      CST_COFINS: getTag(cofinsDet, 'CST'),
      pCOFINS: parseFloat(getTag(cofinsDet, 'pCOFINS') || '0'),
      vBC_PIS: parseFloat(getTag(pisDet, 'vBC') || '0'),
      vBC_COFINS: parseFloat(getTag(cofinsDet, 'vBC') || '0'),
    }
  })

  const nfeRefs = getAllTags(doc, 'NFref')
  const nfsRef = nfeRefs.map(r => ({
    chNFe: getTag(r, 'refNFe'),
    nRef: getTag(r, 'nNF'),
    serieRef: getTag(r, 'serie'),
    cnpjRef: getTag(r, 'CNPJ'),
  })).filter(r => r.chNFe || r.nRef)

  const infCpl = getTag(doc, 'infCpl')

  return {
    tipo: 'nfe',
    chave: infNFe.getAttribute('Id') || '',
    nNF: getTag(ide, 'nNF'),
    CFOP: getTag(dets[0]?.getElementsByTagName('prod')[0] || doc, 'CFOP'),
    natOp: getTag(ide, 'natOp'),
    cnpjEmit: parseCNPJ(getTag(emit, 'CNPJ')),
    cnpjDest: parseCNPJ(getTag(dest, 'CNPJ')),
    xNome_dest: getTag(dest, 'xNome'),
    UF_dest: getTag(dest, 'UF') || getTag(doc, 'UF'),
    cMun_dest: getTag(dest, 'cMun'),
    vProd: parseFloat(getTag(total, 'vProd') || '0'),
    vICMS: parseFloat(getTag(total, 'vICMS') || '0'),
    vICMSST: parseFloat(getTag(total, 'vICMSST') || '0'),
    vNF: parseFloat(getTag(total, 'vNF') || '0'),
    vPIS_total: parseFloat(getTag(total, 'vPIS') || '0'),
    vCOFINS_total: parseFloat(getTag(total, 'vCOFINS') || '0'),
    nfsRef,
    infCpl,
    itens,
    raw: doc,
  }
}

// ── Detecção automática de cenário ────────────────────────────────────────────
// Retorna { cenario, label, cor } ou null se não identificado
function detectarCenario(dados) {
  if (!dados) return null

  if (dados.tipo === 'nfse') {
    if (dados.cTribNac === '100901') return { cenario: 'comissao', label: 'NFS-e · Comissão Kaeser', cor: '#7C3AED' }
    return { cenario: 'nfse_manutencao', label: 'NFS-e · Manutenção', cor: 'var(--blue)' }
  }

  if (dados.tipo !== 'nfe') return null

  const cfops = [...new Set(dados.itens.map(i => normCFOP(i.CFOP)))]
  const cfopPrimary = normCFOP(dados.CFOP)

  // Conserto remessa: 5915 ou 6915
  if (cfops.some(c => ['5915', '6915'].includes(c)))
    return { cenario: 'conserto_remessa', label: 'NF-e · Conserto — Remessa', cor: '#F59E0B' }

  // Conserto retorno: 5916 ou 6916
  if (cfops.some(c => ['5916', '6916'].includes(c)))
    return { cenario: 'conserto_retorno', label: 'NF-e · Conserto — Retorno', cor: '#F59E0B' }

  // Óleo remessa futura: 6117
  if (cfops.some(c => c === '6117'))
    return { cenario: 'oleo_remessa', label: 'NF-e · Óleo — Remessa Futura', cor: '#0D9488' }

  // Óleo venda normal: 5405 ou 6403, NCM 3403
  const temNCMOleo = dados.itens.some(i => (i.NCM || '').replace(/\./g, '').startsWith('3403'))
  if (cfops.some(c => ['5405', '6403'].includes(c)) || temNCMOleo)
    return { cenario: 'oleo', label: 'NF-e · Óleo / Lubrificante', cor: 'var(--orange)' }

  // Peças/filtros: NCM 8421
  const temNCMFiltros = dados.itens.some(i => (i.NCM || '').replace(/\./g, '').startsWith('8421'))
  if (temNCMFiltros || cfops.some(c => ['6102', '5102'].includes(c)))
    return { cenario: 'pecas', label: 'NF-e · Peças / Filtros', cor: '#7C3AED' }

  // Importado revenda: origem 8 ou 9 + CFOP 62xx
  const temOrigImportado = dados.itens.some(i => ['8', '9'].includes(i.orig))
  if (temOrigImportado) {
    const temST = dados.vICMSST > 0
    return {
      cenario: temST ? 'importado_revenda' : 'importado_consumo',
      label: temST ? 'NF-e · Importado — Revenda (com ST)' : 'NF-e · Importado — Uso e Consumo (sem ST)',
      cor: '#0891B2',
    }
  }

  return { cenario: 'desconhecido', label: 'NF-e · Tipo não identificado', cor: 'var(--text-3)' }
}

// ── Motor de auditoria — produz lista de VeredItems ───────────────────────────
// Cada item: { status: 'ok'|'erro'|'aviso', campo, esperado, encontrado, mensagem, explicacao }

function auditarNFSe(d) {
  const items = []

  const add = (status, campo, encontrado, esperado, mensagem, explicacao = '') =>
    items.push({ status, campo, encontrado, esperado, mensagem, explicacao })

  // CNPJ emitente
  const cnpjEmit = d.cnpjPrestador
  if (cnpjEmit === GV_CNPJ)
    add('ok', 'CNPJ Prestador', fmtCNPJ(cnpjEmit), fmtCNPJ(GV_CNPJ), 'CNPJ da Gera Vale confirmado')
  else
    add('erro', 'CNPJ Prestador', fmtCNPJ(cnpjEmit) || '—', fmtCNPJ(GV_CNPJ), 'CNPJ do prestador não é o da Gera Vale', 'Verifique se o XML pertence à Gera Vale. CNPJ correto: 19.090.416/0001-76')

  // Código tributação nacional
  const tribOk = ['140101', '100901'].includes(d.cTribNac)
  if (d.cTribNac === '140101')
    add('ok', 'cTribNac', d.cTribNac, '140101 ou 100901', 'Código 140101 — Manutenção/reparação ✓')
  else if (d.cTribNac === '100901')
    add('ok', 'cTribNac', d.cTribNac, '140101 ou 100901', 'Código 100901 — Comissão/representação ✓')
  else
    add('erro', 'cTribNac', d.cTribNac || '—', '140101 (manutenção) ou 100901 (comissão)', 'Código de tributação nacional incorreto', 'A Gera Vale usa 140101 para manutenção e 100901 para comissão Kaeser. Outro código indica cenário errado.')

  // Código tributação municipal
  const tribMunNorm = (d.cTribMun || '').replace(/^0+/, '')
  if (tribMunNorm === '68' || d.cTribMun === '0068' || d.cTribMun === '068')
    add('ok', 'cTribMun', d.cTribMun, '0068', 'Código 0068 — Manutenção e conservação de máquinas ✓')
  else if (d.cTribMun)
    add('erro', 'cTribMun', d.cTribMun, '0068', 'Código municipal incorreto', 'SJC usa o código 0068 para serviços de manutenção. Emitir com código errado pode invalidar a nota ou gerar duplicidade.')

  // NBS
  if (d.cNBS)
    add('ok', 'cNBS', d.cNBS, '1.2001.50.00', 'NBS informado ✓')
  else
    add('aviso', 'cNBS', '—', '1.2001.50.00', 'NBS ausente', 'A NBS correta é 1.2001.50.00 (manutenção de maquinário industrial). Ausente pode causar rejeição em futuras validações do portal.')

  // Indicador de operação
  const indOpsValidos = ['050101', '050102', '050103', '050104', '100301']
  const indOpsLabel = { '050101': 'Oficina GV', '050102': 'Endereço do cliente', '050103': 'Outra empresa', '050104': 'Outro endereço', '100301': 'Comissão' }
  if (indOpsValidos.includes(d.cIndOp))
    add('ok', 'cIndOp', `${d.cIndOp} — ${indOpsLabel[d.cIndOp] || ''}`, 'Válido para o cenário', 'Indicador de operação válido ✓')
  else if (d.cIndOp === '050103')
    add('aviso', 'cIndOp', d.cIndOp, '050102 (serviço no cliente)', 'cIndOp 050103 aceito mas recomenda-se 050102 para serviço no cliente', 'O 050103 indica que o tomador (quem paga) é diferente de quem recebe o serviço. Se é o mesmo cliente, use 050102.')
  else
    add('erro', 'cIndOp', d.cIndOp || '—', `${indOpsValidos.join(' / ')}`, 'Indicador de operação inválido', 'Valores válidos: 050101 (oficina), 050102 (cliente), 050104 (outro end.), 100301 (comissão Kaeser).')

  // Local de prestação
  const locNorm = (d.cLocPrestacao || '').replace(/^0+/, '')
  const sjcNorm = SJC_IBGE.replace(/^0+/, '')
  if (locNorm === sjcNorm)
    add('ok', 'Local de prestação', `${d.cLocPrestacao} — São José dos Campos`, SJC_IBGE, 'Local SJC confirmado ✓')
  else if (d.cLocPrestacao)
    add('aviso', 'Local de prestação', d.cLocPrestacao, SJC_IBGE + ' (SJC)', 'Local de prestação diferente de SJC', 'Se o serviço foi feito na oficina da Gera Vale, o local deve ser SJC (3549904). Se foi no cliente, confirme se o código IBGE é da cidade do cliente.')
  else
    add('aviso', 'Local de prestação', '—', SJC_IBGE, 'Local de prestação ausente', 'O campo cLocPrestacao é obrigatório na NFS-e Nacional.')

  // Alíquota ISS
  if (Math.abs(d.pAliqISS - 3) < 0.01)
    add('ok', 'Alíquota ISS', `${fmtNum(d.pAliqISS)}%`, '3,00%', 'Alíquota ISS 3% ✓')
  else if (d.pAliqISS > 0)
    add('erro', 'Alíquota ISS', `${fmtNum(d.pAliqISS)}%`, '3,00%', `ISS com alíquota ${fmtNum(d.pAliqISS)}% — esperado 3%`, 'SJC fixa a alíquota de ISS em 3% para serviços de manutenção. A Gera Vale não deve enviar a alíquota (Omie não envia por padrão) — se aparecer, verifique a configuração.')
  else
    add('aviso', 'Alíquota ISS', '—', '3,00%', 'Alíquota ISS não encontrada no XML', 'Pode estar ausente porque o Omie não envia (normal). Confira o valor do ISS calculado.')

  // Valor ISS
  if (d.vServ > 0 && d.vISS > 0) {
    const aliqCalc = (d.vISS / d.vServ) * 100
    if (Math.abs(aliqCalc - 3) < 0.1)
      add('ok', 'Valor ISS', fmtMoeda(d.vISS), `3% de ${fmtMoeda(d.vServ)} = ${fmtMoeda(d.vServ * 0.03)}`, 'Valor do ISS confere com 3% ✓')
    else
      add('erro', 'Valor ISS', fmtMoeda(d.vISS), fmtMoeda(d.vServ * 0.03), 'ISS calculado não bate com 3% do valor do serviço', `3% de ${fmtMoeda(d.vServ)} = ${fmtMoeda(d.vServ * 0.03)}. ISS na nota: ${fmtMoeda(d.vISS)}.`)
  }

  // PIS
  if (d.CST_PIS === '01')
    add('ok', 'PIS CST', d.CST_PIS, '01', `PIS CST 01 — alíquota ${fmtNum(d.pPIS)}% ✓`)
  else if (d.CST_PIS)
    add('erro', 'PIS CST', d.CST_PIS, '01', 'CST do PIS incorreto', 'Gera Vale (Lucro Presumido) usa CST 01 — tributação pelo regime cumulativo.')

  if (d.pPIS > 0 && Math.abs(d.pPIS - 0.65) > 0.01)
    add('erro', 'Alíquota PIS', `${fmtNum(d.pPIS)}%`, '0,65%', `Alíquota PIS ${fmtNum(d.pPIS)}% — esperado 0,65%`, 'Lucro Presumido: PIS cumulativo = 0,65%.')
  else if (d.pPIS > 0)
    add('ok', 'Alíquota PIS', `${fmtNum(d.pPIS)}%`, '0,65%', 'Alíquota PIS 0,65% ✓')

  // COFINS
  if (d.CST_COFINS === '01')
    add('ok', 'COFINS CST', d.CST_COFINS, '01', `COFINS CST 01 — alíquota ${fmtNum(d.pCOFINS)}% ✓`)
  else if (d.CST_COFINS)
    add('erro', 'COFINS CST', d.CST_COFINS, '01', 'CST do COFINS incorreto', 'Gera Vale (Lucro Presumido) usa CST 01 — regime cumulativo.')

  if (d.pCOFINS > 0 && Math.abs(d.pCOFINS - 3.0) > 0.01)
    add('erro', 'Alíquota COFINS', `${fmtNum(d.pCOFINS)}%`, '3,00%', `Alíquota COFINS ${fmtNum(d.pCOFINS)}% — esperado 3,00%`, 'Lucro Presumido: COFINS cumulativo = 3,00%.')
  else if (d.pCOFINS > 0)
    add('ok', 'Alíquota COFINS', `${fmtNum(d.pCOFINS)}%`, '3,00%', 'Alíquota COFINS 3,00% ✓')

  // Retenção PIS/COFINS/CSLL
  if (d.tpRetPisCofins === '3')
    add('ok', 'Retenção 4,65%', 'tpRetPisCofins = 3', '3 (PIS+COFINS+CSLL retidos)', 'Retenção 4,65% configurada ✓')
  else if (d.tpRetPisCofins && d.tpRetPisCofins !== '0')
    add('aviso', 'Retenção 4,65%', `tpRetPisCofins = ${d.tpRetPisCofins}`, '3 ou 0', 'Tipo de retenção diferente do padrão', 'Para PJ fora do Simples com nota ≥ R$ 215,06, use tpRetPisCofins = 3 (PIS+COFINS+CSLL). Para quem não retém, use 0.')
  else if (d.vServ >= 215.06 && d.tpRetPisCofins === '0')
    add('aviso', 'Retenção 4,65%', 'Sem retenção', '3 (se tomador PJ fora do Simples)', 'Nota ≥ R$ 215,06 — confirme se o tomador é PJ fora do Simples', 'Se for PJ fora do Simples, deveria ter retenção de 4,65% (PIS 0,65% + COFINS 3% + CSLL 1%).')

  // IBS/CBS
  if (d.vIBS > 0 || d.vCBS > 0) {
    if (d.CST_IBS === '000')
      add('ok', 'IBS/CBS CST', d.CST_IBS, '000', 'IBS/CBS CST 000 — tributação integral ✓')
    else
      add('erro', 'IBS/CBS CST', d.CST_IBS || '—', '000', 'CST do IBS/CBS incorreto', 'Usar CST 000 = tributação integral. Reforma tributária (IBS/CBS) para serviços da Gera Vale.')

    if (d.cClassTrib === '000001')
      add('ok', 'cClassTrib', d.cClassTrib, '000001', 'Classificação tributária 000001 ✓')
    else
      add('erro', 'cClassTrib', d.cClassTrib || '—', '000001', 'Classificação tributária IBS/CBS incorreta', 'Deve ser 000001 para serviços tributados integralmente pela reforma.')
  }

  return items
}

function auditarNFeOleo(d) {
  const items = []
  const add = (status, campo, encontrado, esperado, mensagem, explicacao = '') =>
    items.push({ status, campo, encontrado, esperado, mensagem, explicacao })

  // CFOP vs UF destino — cruzamento CRÍTICO
  const cfops = [...new Set(d.itens.map(i => normCFOP(i.CFOP)))]
  const uf = d.UF_dest
  const ehInterestadual = uf && uf !== 'SP'
  const ehDentroSP = uf === 'SP'

  if (ehDentroSP) {
    if (cfops.some(c => c === '5405'))
      add('ok', 'CFOP × UF destino', `${cfops.join(', ')} / ${uf}`, '5405 para SP', 'CFOP 5405 correto para venda dentro de SP ✓')
    else if (cfops.some(c => c.startsWith('6')))
      add('erro', 'CFOP × UF destino', `${cfops.join(', ')} / ${uf}`, '5405', '⚠️ CFOP começa com 6 mas destino é SP — inconsistência!', 'CFOP iniciado em 6 indica operação interestadual, mas o endereço do destinatário é SP. Verifique o CFOP ou o endereço do cliente.')
    else
      add('erro', 'CFOP × UF destino', `${cfops.join(', ')} / SP`, '5405', 'CFOP incorreto para venda de óleo em SP', 'Para venda de óleo lubrificante dentro de SP, use CFOP 5405.')
  } else if (ehInterestadual) {
    if (cfops.some(c => c === '6403'))
      add('ok', 'CFOP × UF destino', `${cfops.join(', ')} / ${uf}`, '6403 para interestadual', 'CFOP 6403 correto para venda interestadual ✓')
    else if (cfops.some(c => c.startsWith('5')))
      add('erro', 'CFOP × UF destino', `${cfops.join(', ')} / ${uf}`, '6403', '⚠️ CFOP começa com 5 mas destino é fora de SP — inconsistência!', 'CFOP iniciado em 5 indica operação dentro de SP, mas o endereço do destinatário é ' + uf + '. Verifique o CFOP ou o endereço do cliente.')
    else
      add('erro', 'CFOP × UF destino', `${cfops.join(', ')} / ${uf}`, '6403', 'CFOP incorreto para venda interestadual de óleo', 'Para venda de óleo fora de SP, use CFOP 6403.')
  } else {
    add('aviso', 'CFOP × UF destino', cfops.join(', '), '5405 (SP) ou 6403 (interestadual)', 'UF de destino não identificada — confira CFOP manualmente', 'Não foi possível determinar o estado de destino. CFOP 5405 para SP, 6403 para fora.')
  }

  // NCM e CEST
  d.itens.forEach(item => {
    const pfx = `Item ${item.nItem}`
    const ncmNorm = (item.NCM || '').replace(/\./g, '')

    if (ncmNorm === '34039900')
      add('ok', `${pfx} NCM`, item.NCM, '3403.99.00', `NCM ${item.NCM} — óleo lubrificante ✓`)
    else
      add('erro', `${pfx} NCM`, item.NCM || '—', '3403.99.00', `NCM incorreto para óleo lubrificante Kaeser`, 'O óleo ANS460 da Kaeser usa NCM 3403.99.00. Outro NCM pode indicar produto errado ou erro de cadastro.')

    const cestNorm = (item.CEST || '').replace(/\./g, '')
    if (cestNorm === '0601700')
      add('ok', `${pfx} CEST`, item.CEST, '06.017.00', `CEST correto ✓`)
    else if (item.CEST)
      add('aviso', `${pfx} CEST`, item.CEST, '06.017.00', 'CEST diferente do esperado para óleo lubrificante', 'CEST correto: 06.017.00. CEST errado pode afetar o cálculo da ST.')
    else
      add('aviso', `${pfx} CEST`, '—', '06.017.00', 'CEST ausente', 'Produto com ST precisa do CEST. Use 06.017.00 para lubrificante.')

    // Origem
    if (item.orig === '2')
      add('ok', `${pfx} Origem`, item.orig, '2', 'Origem 2 — estrangeiro procedência conhecida ✓')
    else
      add('erro', `${pfx} Origem`, item.orig || '—', '2', 'Origem do produto incorreta', 'O óleo Kaeser é importado com procedência conhecida. Origem deve ser 2. Origem diferente altera a alíquota de ICMS interestadual.')

    // ICMS interestadual
    if (ehInterestadual) {
      if (Math.abs(item.pICMS - 4) < 0.01)
        add('ok', `${pfx} ICMS interestadual`, `${fmtNum(item.pICMS)}%`, '4%', 'ICMS 4% (interestadual, produto estrangeiro) ✓')
      else if (item.pICMS > 0)
        add('erro', `${pfx} ICMS interestadual`, `${fmtNum(item.pICMS)}%`, '4%', 'Alíquota ICMS errada para operação interestadual', 'Produto de origem estrangeira (orig 2) em operação interestadual: ICMS = 4%. Alíquota diferente gera cobrança incorreta.')
    } else if (ehDentroSP) {
      // Em SP, ST já recolhida: CST 60 esperado
      const cst = item.CST_ICMS
      if (cst === '060' || cst === '60')
        add('ok', `${pfx} CST ICMS (SP)`, cst, '060', 'CST 060 — ST já recolhida anteriormente ✓')
      else if (cst)
        add('aviso', `${pfx} CST ICMS (SP)`, cst, '060', 'CST diferente de 060 para venda em SP', 'Venda de óleo dentro de SP: a ST foi recolhida na entrada. CST esperado: 060.')
    }

    // ST por estado
    if (ehInterestadual && item.vICMSST > 0) {
      const stEsperado = { PE: 20.5, ES: 17 }[uf]
      if (stEsperado) {
        if (Math.abs(item.pICMSST - stEsperado) < 0.2)
          add('ok', `${pfx} ICMS-ST (${uf})`, `${fmtNum(item.pICMSST)}%`, `${stEsperado}%`, `ICMS-ST correto para ${uf} ✓`)
        else if (item.pICMSST > 0)
          add('erro', `${pfx} ICMS-ST (${uf})`, `${fmtNum(item.pICMSST)}%`, `${stEsperado}%`, `Alíquota ICMS-ST incorreta para ${uf}`, `${uf} usa ICMS-ST de ${stEsperado}%. Alíquota errada implica GNRE incorreta.`)
      }
    }

    // Base PIS/COFINS
    if (item.vBC_PIS > 0) {
      const baseEsperada = item.vProd - item.vICMS
      if (Math.abs(item.vBC_PIS - baseEsperada) < 0.05)
        add('ok', `${pfx} Base PIS/COFINS`, fmtMoeda(item.vBC_PIS), `vProd − ICMS = ${fmtMoeda(baseEsperada)}`, 'Base PIS/COFINS = vProd − ICMS ✓')
      else
        add('erro', `${pfx} Base PIS/COFINS`, fmtMoeda(item.vBC_PIS), fmtMoeda(baseEsperada), 'Base PIS/COFINS diferente de vProd − ICMS', `Esperado: ${fmtMoeda(item.vProd)} − ${fmtMoeda(item.vICMS)} = ${fmtMoeda(baseEsperada)}. Encontrado: ${fmtMoeda(item.vBC_PIS)}. Base errada gera PIS/COFINS incorreto.`)
    }
  })

  // GNRE
  if (ehInterestadual && ['PE', 'ES'].includes(uf))
    add('aviso', 'GNRE', 'Pendente', 'Emitir após autorização', `Após autorizar a nota, emitir GNRE para ${uf}`, `Para ${uf}, é necessário pagar a GNRE de ICMS-ST antes da saída da mercadoria.`)

  return items
}

function auditarNFeOleoRemessa(d) {
  const items = []
  const add = (status, campo, encontrado, esperado, mensagem, explicacao = '') =>
    items.push({ status, campo, encontrado, esperado, mensagem, explicacao })

  const cfops = [...new Set(d.itens.map(i => normCFOP(i.CFOP)))]

  // CFOP
  if (cfops.some(c => c === '6117'))
    add('ok', 'CFOP', cfops.join(', '), '6117', 'CFOP 6117 — remessa p/ entrega futura ✓')
  else
    add('erro', 'CFOP', cfops.join(', ') || '—', '6117', 'CFOP incorreto para remessa futura de óleo', 'Remessa complementar de óleo (entrega do saldo pendente de nota anterior): CFOP 6117.')

  // UF destino × inicio CFOP
  if (d.UF_dest === 'SP')
    add('erro', 'CFOP × UF destino', `6117 / ${d.UF_dest}`, 'Interestadual (fora de SP)', 'Remessa futura de óleo é sempre interestadual', 'CFOP 6117 é usado apenas quando o destino é fora de SP. Venda dentro de SP usa 5117.')

  // NF de origem referenciada
  if (d.nfsRef && d.nfsRef.length > 0) {
    const ref = d.nfsRef[0]
    const refLabel = ref.chNFe ? `…${ref.chNFe.slice(-8)}` : `Série ${ref.serieRef} nº ${ref.nRef}`
    add('ok', 'NF de origem', refLabel, 'Obrigatório', 'NF de origem referenciada no XML ✓')
  } else {
    const mencaoNF = d.infCpl && /(?:NF-e\s+Ref|NF\s+origem|serie.*numero|nNF)/i.test(d.infCpl)
    if (mencaoNF)
      add('aviso', 'NF de origem', 'Nas obs. complementares', 'XML NFref', 'NF citada nas obs. mas não no campo NFref', 'Preferível referenciar no campo NFref do XML, não só no texto. Isso garante o vínculo fiscal.')
    else
      add('erro', 'NF de origem', '—', 'NFref no XML', 'NF de origem não referenciada', 'CFOP 6117 exige que a NF que originou a venda seja referenciada no campo NFref. Sem esse vínculo, a nota pode ser rejeitada ou autuada.')
  }

  // CST ICMS / ICMS = 0
  d.itens.forEach(item => {
    const pfx = `Item ${item.nItem}`

    const cst = item.CST_ICMS
    if (cst === '041' || cst === '41')
      add('ok', `${pfx} CST ICMS`, cst, '041', 'CST 041 — monofásico, não incidência ✓')
    else
      add('erro', `${pfx} CST ICMS`, cst || '—', '041', 'CST ICMS incorreto para remessa futura de óleo', 'O óleo lubrificante em SP tem tributação monofásica. Na remessa de entrega futura o imposto já foi recolhido integralmente na NF de origem: CST deve ser 041 (não incidência, art. 7º XIV RICMS/SP).')

    if (item.vICMS === 0)
      add('ok', `${pfx} ICMS`, fmtMoeda(0), 'R$ 0,00', 'ICMS = R$ 0,00 — imposto já recolhido na NF de origem ✓')
    else
      add('erro', `${pfx} ICMS`, fmtMoeda(item.vICMS), 'R$ 0,00', 'ICMS deve ser zero nesta nota', 'O ICMS foi recolhido integralmente na nota de faturamento original. Destacar novamente gera recolhimento em duplicidade.')

    if (item.vICMSST === 0)
      add('ok', `${pfx} ICMS-ST`, fmtMoeda(0), 'R$ 0,00', 'ICMS-ST = R$ 0,00 ✓')
    else
      add('erro', `${pfx} ICMS-ST`, fmtMoeda(item.vICMSST), 'R$ 0,00', 'ICMS-ST deve ser zero', 'ST já recolhida na nota de origem. Não há ST nova nesta remessa.')

    const ncmNorm = (item.NCM || '').replace(/\./g, '')
    if (ncmNorm === '34039900')
      add('ok', `${pfx} NCM`, item.NCM, '3403.99.00', 'NCM 3403.99.00 ✓')
    else
      add('erro', `${pfx} NCM`, item.NCM || '—', '3403.99.00', 'NCM incorreto para óleo lubrificante', '')
  })

  // Fundamento legal
  const temFundamento = d.infCpl && /art\.?\s*7[°º]|RICMS|Decreto.*45\.490|n[ãa]o\s+incid/i.test(d.infCpl)
  if (temFundamento)
    add('ok', 'Fundamento legal', 'Presente nas obs.', 'Art. 7º XIV RICMS/SP', 'Fundamento legal citado nas informações complementares ✓')
  else
    add('aviso', 'Fundamento legal', '—', 'Art. 7º, XIV, RICMS/SP', 'Fundamento da não incidência ausente', 'Recomendado citar "Art. 7º, XIV, RICMS/SP (Decreto nº 45.490/2000)" nas informações complementares para justificar ICMS = 0.')

  return items
}

function auditarNFePecas(d) {
  const items = []
  const add = (status, campo, encontrado, esperado, mensagem, explicacao = '') =>
    items.push({ status, campo, encontrado, esperado, mensagem, explicacao })

  const cfops = [...new Set(d.itens.map(i => normCFOP(i.CFOP)))]
  const uf = d.UF_dest
  const ehInterestadual = uf && uf !== 'SP'
  const ehDentroSP = uf === 'SP'

  // CFOP × UF
  if (ehInterestadual) {
    if (cfops.some(c => c === '6102'))
      add('ok', 'CFOP × UF', `${cfops.join(', ')} / ${uf}`, '6102', 'CFOP 6102 correto para venda interestadual de peças ✓')
    else if (cfops.some(c => c.startsWith('5')))
      add('erro', 'CFOP × UF', `${cfops.join(', ')} / ${uf}`, '6102', '⚠️ CFOP começa com 5 mas destino é fora de SP', 'Venda interestadual de peças requer CFOP 6xxx. Verificar cadastro do cliente — UF pode estar errada.')
    else
      add('erro', 'CFOP × UF', `${cfops.join(', ')} / ${uf}`, '6102', 'CFOP incorreto para venda interestadual de peças', '')
  } else if (ehDentroSP) {
    if (cfops.some(c => c === '5102'))
      add('ok', 'CFOP × UF', `${cfops.join(', ')} / SP`, '5102', 'CFOP 5102 correto para venda de peças dentro de SP ✓')
    else
      add('aviso', 'CFOP × UF', `${cfops.join(', ')} / SP`, '5102', 'CFOP pode estar incorreto para SP', 'Venda de peças dentro de SP: CFOP 5102.')
  }

  d.itens.forEach(item => {
    const pfx = `Item ${item.nItem}`
    const ncmNorm = (item.NCM || '').replace(/\./g, '')

    // NCM
    if (['84219910', '84219999', '84219900'].includes(ncmNorm))
      add('ok', `${pfx} NCM`, item.NCM, '8421.99.10 ou 8421.99.99', `NCM ${item.NCM} — filtros/separadores Kaeser ✓`)
    else if (ncmNorm.startsWith('8421'))
      add('aviso', `${pfx} NCM`, item.NCM, '8421.99.10 ou 8421.99.99', 'NCM dentro do grupo 8421 mas subposição diferente', 'Confirme com a contabilidade se o produto é filtro (8421.99.10) ou separador (8421.99.99).')
    else
      add('erro', `${pfx} NCM`, item.NCM || '—', '8421.99.10', 'NCM não está no grupo 8421 (filtros/separadores)', 'Filtros e separadores Kaeser devem usar NCM 8421.99.xx. NCM diferente pode alterar tributação e gerar ICMS-ST indevida.')

    // Origem
    if (item.orig === '2')
      add('ok', `${pfx} Origem`, item.orig, '2', 'Origem 2 — estrangeiro procedência conhecida ✓')
    else
      add('erro', `${pfx} Origem`, item.orig || '—', '2', 'Origem incorreta para filtros Kaeser', 'Filtros são importados com procedência conhecida: Origem 2. Origem diferente gera ICMS interestadual errado (deveria ser 4%, não 12%).')

    // CST ICMS
    if (item.CST_ICMS === '200' || item.CST_ICMS === '20')
      add('ok', `${pfx} CST ICMS`, item.CST_ICMS, '200', 'CST 200 — origem 2, tributado normal ✓')
    else if (item.CST_ICMS)
      add('erro', `${pfx} CST ICMS`, item.CST_ICMS, '200', 'CST ICMS incorreto para filtros importados', 'Produto estrangeiro (orig 2) tributado normalmente: CST 200.')

    // ICMS 4%
    if (ehInterestadual) {
      if (Math.abs(item.pICMS - 4) < 0.01)
        add('ok', `${pfx} ICMS`, `${fmtNum(item.pICMS)}%`, '4%', 'ICMS 4% (interestadual, origem 2) ✓')
      else if (item.pICMS > 0)
        add('erro', `${pfx} ICMS`, `${fmtNum(item.pICMS)}%`, '4%', 'Alíquota ICMS errada para peças importadas', `Produto de origem estrangeira (orig 2) em operação interestadual: ICMS = 4%. Encontrado: ${fmtNum(item.pICMS)}%.`)
    }

    // ICMS-ST = 0
    if (item.vICMSST === 0)
      add('ok', `${pfx} ICMS-ST`, fmtMoeda(0), 'R$ 0,00', 'Sem ICMS-ST — filtros NCM 8421 não têm substituição ✓')
    else
      add('erro', `${pfx} ICMS-ST`, fmtMoeda(item.vICMSST), 'R$ 0,00', 'ICMS-ST indevida para filtros', 'Filtros (NCM 8421) não estão sujeitos a ST. ICMS-ST destacado é imposto a maior, não deve ser cobrado do cliente.')
  })

  return items
}

function auditarNFeConsertoRemessa(d) {
  const items = []
  const add = (status, campo, encontrado, esperado, mensagem, explicacao = '') =>
    items.push({ status, campo, encontrado, esperado, mensagem, explicacao })

  const cfops = [...new Set(d.itens.map(i => normCFOP(i.CFOP)))]
  const uf = d.UF_dest
  const ehInterestadual = uf && uf !== 'SP'
  const ehDentroSP = uf === 'SP'

  // CFOP
  if (ehDentroSP) {
    if (cfops.some(c => c === '5915'))
      add('ok', 'CFOP × UF', `${cfops.join(', ')} / SP`, '5915', 'CFOP 5915 correto para remessa de conserto dentro de SP ✓')
    else if (cfops.some(c => c.startsWith('6')))
      add('erro', 'CFOP × UF', `${cfops.join(', ')} / SP`, '5915', '⚠️ CFOP começa com 6 mas destinatário é SP', 'Cliente em SP: usar CFOP 5.915, não 6.915.')
    else
      add('erro', 'CFOP × UF', `${cfops.join(', ')} / SP`, '5915', 'CFOP incorreto para remessa de conserto em SP', '')
  } else if (ehInterestadual) {
    if (cfops.some(c => c === '6915'))
      add('ok', 'CFOP × UF', `${cfops.join(', ')} / ${uf}`, '6915', 'CFOP 6915 correto para remessa interestadual de conserto ✓')
    else if (cfops.some(c => c.startsWith('5')))
      add('erro', 'CFOP × UF', `${cfops.join(', ')} / ${uf}`, '6915', `⚠️ CFOP começa com 5 mas destinatário é ${uf}`, 'Equipamento vindo de fora de SP: usar CFOP 6.915.')
    else
      add('erro', 'CFOP × UF', cfops.join(', '), '6915', 'CFOP incorreto para remessa interestadual de conserto', '')
  }

  // ICMS e impostos — conserto não gera ICMS
  d.itens.forEach(item => {
    const pfx = `Item ${item.nItem}`
    if (item.vICMS === 0)
      add('ok', `${pfx} ICMS`, fmtMoeda(0), 'R$ 0,00', 'Sem ICMS na remessa para conserto ✓')
    else
      add('erro', `${pfx} ICMS`, fmtMoeda(item.vICMS), 'R$ 0,00', 'ICMS indevido em remessa para conserto', 'Remessa de bem para conserto não é venda — não incide ICMS. Imposto destacado é erro.')
  })

  add('aviso', 'Registro Omie', 'Verificar', 'SCRKR associado', 'Confirmar: produto associado ao SCRKR, estoque E.MOV, sem conta a pagar', 'No Omie: use o produto existente associado ao SCRKR. Nunca cadastre novo produto. Local de estoque: E.MOV. Categoria: "Mercadoria recebida para conserto". Sem conta a pagar ou receber.')

  return items
}

function auditarNFeConsertoRetorno(d) {
  const items = []
  const add = (status, campo, encontrado, esperado, mensagem, explicacao = '') =>
    items.push({ status, campo, encontrado, esperado, mensagem, explicacao })

  const cfops = [...new Set(d.itens.map(i => normCFOP(i.CFOP)))]
  const uf = d.UF_dest
  const ehInterestadual = uf && uf !== 'SP'
  const ehDentroSP = uf === 'SP'

  // CFOP
  if (ehDentroSP) {
    if (cfops.some(c => c === '5916'))
      add('ok', 'CFOP × UF', `${cfops.join(', ')} / SP`, '5916', 'CFOP 5916 correto para retorno de conserto em SP ✓')
    else if (cfops.some(c => c.startsWith('6')))
      add('erro', 'CFOP × UF', `${cfops.join(', ')} / SP`, '5916', '⚠️ CFOP começa com 6 mas destinatário é SP', 'Retorno para cliente em SP: CFOP 5.916.')
    else
      add('erro', 'CFOP × UF', cfops.join(', '), '5916', 'CFOP incorreto para retorno de conserto em SP', '')
  } else if (ehInterestadual) {
    if (cfops.some(c => c === '6916'))
      add('ok', 'CFOP × UF', `${cfops.join(', ')} / ${uf}`, '6916', 'CFOP 6916 correto para retorno interestadual de conserto ✓')
    else if (cfops.some(c => c.startsWith('5')))
      add('erro', 'CFOP × UF', `${cfops.join(', ')} / ${uf}`, '6916', `⚠️ CFOP começa com 5 mas destinatário é ${uf}`, 'Retorno para cliente fora de SP: CFOP 6.916.')
    else
      add('erro', 'CFOP × UF', cfops.join(', '), '6916', 'CFOP incorreto para retorno interestadual de conserto', '')
  }

  // Impostos
  d.itens.forEach(item => {
    const pfx = `Item ${item.nItem}`
    if (item.vICMS === 0)
      add('ok', `${pfx} ICMS`, fmtMoeda(0), 'R$ 0,00', 'Sem ICMS no retorno de conserto ✓')
    else
      add('erro', `${pfx} ICMS`, fmtMoeda(item.vICMS), 'R$ 0,00', 'ICMS indevido em retorno de conserto', 'Retorno de bem consertado não é venda — sem ICMS.')
  })

  add('aviso', 'Par de notas', 'Verificar', 'Entrada correspondente', 'Confirmar: esta nota de retorno tem NF de remessa correspondente no Omie', 'O retorno (5916/6916) deve ser gerado a partir da nota de entrada (5915/6915). Itens, valores e NCM devem ser iguais.')

  return items
}

function auditarNFSeMov(d) {
  const items = []
  const add = (status, campo, encontrado, esperado, mensagem, explicacao = '') =>
    items.push({ status, campo, encontrado, esperado, mensagem, explicacao })

  // Código — deve ser 100901 para comissão
  if (d.cTribNac === '100901')
    add('ok', 'cTribNac', d.cTribNac, '100901', 'Código 100901 — Comissão/representação ✓')
  else
    add('erro', 'cTribNac', d.cTribNac || '—', '100901', 'Nota de comissão deve usar cTribNac 100901', 'Comissão de representação usa código 100901. O código 140101 é exclusivo para manutenção. Usar errado pode causar cobrança de ISS com código errado.')

  // Indicador — comissão usa 100301
  if (d.cIndOp === '100301')
    add('ok', 'cIndOp', d.cIndOp, '100301', 'cIndOp 100301 — comissão ✓')
  else
    add('erro', 'cIndOp', d.cIndOp || '—', '100301', 'Indicador de operação incorreto para comissão', 'Comissão Kaeser usa cIndOp 100301.')

  // Demais campos fiscais igual à NFS-e padrão
  if (d.CST_PIS === '01') add('ok', 'PIS CST', d.CST_PIS, '01', 'PIS CST 01 ✓')
  else add('erro', 'PIS CST', d.CST_PIS || '—', '01', 'CST PIS incorreto', '')

  if (d.pPIS > 0 && Math.abs(d.pPIS - 0.65) > 0.01)
    add('erro', 'Alíquota PIS', `${fmtNum(d.pPIS)}%`, '0,65%', 'Alíquota PIS deve ser 0,65%', '')

  if (d.CST_COFINS === '01') add('ok', 'COFINS CST', d.CST_COFINS, '01', 'COFINS CST 01 ✓')
  else add('erro', 'COFINS CST', d.CST_COFINS || '—', '01', 'CST COFINS incorreto', '')

  return items
}

// ── Roteador de auditoria ─────────────────────────────────────────────────────
function auditar(dados, cenario) {
  if (!dados || !cenario) return []
  switch (cenario) {
    case 'nfse_manutencao': return auditarNFSe(dados)
    case 'comissao':        return auditarNFSeMov(dados)
    case 'oleo':            return auditarNFeOleo(dados)
    case 'oleo_remessa':    return auditarNFeOleoRemessa(dados)
    case 'pecas':           return auditarNFePecas(dados)
    case 'conserto_remessa':return auditarNFeConsertoRemessa(dados)
    case 'conserto_retorno':return auditarNFeConsertoRetorno(dados)
    default:                return []
  }
}

// ── Extrator PDF ──────────────────────────────────────────────────────────────
async function extractPdfText(arrayBuffer) {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  }
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map(it => it.str).join(' ') + '\n'
  }
  return text
}

// ── Parser de espelho PDF do Omie ─────────────────────────────────────────────
// Extrai campos do texto bruto do espelho NF-e ou NFS-e gerado pelo Omie
function parsePdfEspelhoNFe(text) {
  const t = text.replace(/\s+/g, ' ')

  function extrair(regex, grupo = 1) {
    const m = t.match(regex)
    return m ? (m[grupo] || '').trim() : ''
  }
  function extrairNum(regex, grupo = 1) {
    const s = extrair(regex, grupo).replace(/\./g, '').replace(',', '.')
    return parseFloat(s) || 0
  }

  // Número da NF
  const nNF = extrair(/N[ºo°]\.?\s*(?:NF[- ]?e?)?:?\s*(\d+)/i) ||
              extrair(/Número[:\s]+(\d+)/i) ||
              extrair(/NF-?e?\s+n[ºo°]?\s*(\d+)/i)

  // Natureza da operação
  const natOp = extrair(/Nat\.?\s*(?:Op\.?|Operação)[:\s]+([^\n]+?)(?:\s{2,}|CNPJ|Série|Modelo)/i) ||
                extrair(/Natureza\s+da\s+Operação[:\s]+([^\n]+?)(?:\s{2,}|\d{2}\/|\bCNPJ)/i)

  // CFOP (pode ter múltiplos — pega o primeiro)
  const cfopMatch = t.match(/CFOP[:\s]+(\d[\d.]{3,})/i) ||
                    t.match(/\b([56]\d{3})\b/)
  const CFOP = cfopMatch ? cfopMatch[1].replace('.', '') : ''

  // CNPJ emitente
  const cnpjEmit = parseCNPJ(
    extrair(/CNPJ[:\s]+([\d.\/\-]+)/, 1) ||
    extrair(/(\d{2}\.?\d{3}\.?\d{3}\/\d{4}-\d{2})/)
  )

  // Destinatário
  const xNome_dest = extrair(/Destinatário[\/\s]*Remetente[:\s]+([^\n]+?)(?:\s{2,}|CNPJ|CPF|\d{2}\/)/i) ||
                     extrair(/Destinat[aá]rio[:\s]+([^\n]+?)(?:\s{2,}|CNPJ)/i)

  // UF destino
  const ufMatch = t.match(/Município[:\s]+[^\n]+-\s*([A-Z]{2})/i) ||
                  t.match(/UF[:\s]+([A-Z]{2})\b/) ||
                  t.match(/Destinat[^\n]+\b([A-Z]{2})\s*\/\s*\d{8}/) ||
                  t.match(/Endereço[^\n]+-\s*([A-Z]{2})\b/i)
  const UF_dest = ufMatch ? ufMatch[1] : ''

  // CNPJ destinatário — segundo CNPJ encontrado
  const cnpjsAll = [...t.matchAll(/(\d{2}\.?\d{3}\.?\d{3}\/\d{4}-?\d{2})/g)].map(m => parseCNPJ(m[1]))
  const cnpjDest = cnpjsAll.find(c => c !== cnpjEmit && c !== GV_CNPJ) || ''

  // Valores totais
  const vProd = extrairNum(/Valor\s+Total\s+dos\s+Produtos[:\s]+([\d.,]+)/i) ||
                extrairNum(/Total\s+Produtos[:\s]+([\d.,]+)/i)
  const vNF   = extrairNum(/Valor\s+Total\s+da\s+NF[:\s]+([\d.,]+)/i) ||
                extrairNum(/Total\s+NF[:\s]+([\d.,]+)/i) ||
                extrairNum(/TOTAL\s+(?:DA\s+)?NOTA[:\s]+([\d.,]+)/i)
  const vICMS = extrairNum(/Valor\s+do\s+ICMS[:\s]+([\d.,]+)/i) ||
                extrairNum(/ICMS[:\s]+([\d.,]+)/i)
  const vICMSST = extrairNum(/Valor\s+(?:do\s+)?ICMS\s+ST[:\s]+([\d.,]+)/i) ||
                  extrairNum(/ICMS-?ST[:\s]+([\d.,]+)/i)
  const vPIS_total = extrairNum(/Valor\s+(?:do\s+)?PIS[:\s]+([\d.,]+)/i)
  const vCOFINS_total = extrairNum(/Valor\s+(?:da\s+)?COFINS[:\s]+([\d.,]+)/i)

  // NCM — pega o primeiro
  const ncmMatch = t.match(/NCM[\/\s]+SH[:\s]+([\d.]+)/i) ||
                   t.match(/NCM[:\s]+([\d.]+)/i) ||
                   t.match(/\b(\d{4}\.\d{2}\.\d{2})\b/)
  const NCM = ncmMatch ? ncmMatch[1].replace(/\./g, '') : ''

  // CEST
  const cestMatch = t.match(/CEST[:\s]+([\d.]+)/i)
  const CEST = cestMatch ? cestMatch[1].replace(/\./g, '') : ''

  // CST ICMS
  const cstMatch = t.match(/CST[\/\s]*ICMS[:\s]+(\d{2,3})/i) ||
                   t.match(/\bCST[:\s]+(\d{2,3})\b/)
  const CST_ICMS = cstMatch ? cstMatch[1].padStart(3, '0') : ''

  // Alíquota ICMS
  const pICMSMatch = t.match(/Al[íi]quota\s+(?:do\s+)?ICMS[:\s]+([\d,]+)\s*%/i) ||
                     t.match(/ICMS[:\s]*(\d+[,.]?\d*)\s*%/i)
  const pICMS = pICMSMatch ? parseFloat(pICMSMatch[1].replace(',', '.')) : 0

  // Origem
  const origMatch = t.match(/Origem[:\s]*(\d)\b/i)
  const orig = origMatch ? origMatch[1] : ''

  // CST PIS/COFINS
  const cstPisMatch = t.match(/CST\s+PIS[:\s]+(\d{2})/i)
  const CST_PIS = cstPisMatch ? cstPisMatch[1] : ''
  const cstCofinsMatch = t.match(/CST\s+COFINS[:\s]+(\d{2})/i)
  const CST_COFINS = cstCofinsMatch ? cstCofinsMatch[1] : ''

  // NFref (referência)
  const nfrefMatch = t.match(/NF[- ]?Ref[:\s]+([\d]+)/i) ||
                     t.match(/Referência[:\s]+NF[:\s]+([\d]+)/i)
  const nfsRef = nfrefMatch ? [{ nRef: nfrefMatch[1] }] : []

  // Informações complementares
  const infCplMatch = t.match(/Informa[çc][õo]es\s+Complementares[:\s]+([^\n]{0,500})/i) ||
                      t.match(/Dados\s+Adicionais[:\s]+([^\n]{0,500})/i)
  const infCpl = infCplMatch ? infCplMatch[1] : ''

  // Monta item principal com os dados extraídos
  const itens = [{
    nItem: '1',
    cProd: extrair(/Código\s+do\s+Produto[:\s]+(\S+)/i),
    xProd: extrair(/Descrição\s+do\s+Produto[:\s]+([^\n]+?)(?:\s{2,}|NCM|CFOP)/i) ||
           extrair(/Descrição[:\s]+([^\n]+?)(?:\s{2,}|NCM|CFOP)/i),
    NCM,
    CEST,
    CFOP,
    orig,
    CST_ICMS,
    pICMS,
    vICMS,
    pICMSST: extrairNum(/Al[íi]quota\s+ICMS[- ]ST[:\s]+([\d,]+)/i),
    vICMSST,
    vProd,
    vPIS: vPIS_total,
    vCOFINS: vCOFINS_total,
    CST_PIS,
    pPIS: extrairNum(/Al[íi]quota\s+PIS[:\s]+([\d,]+)/i),
    CST_COFINS,
    pCOFINS: extrairNum(/Al[íi]quota\s+COFINS[:\s]+([\d,]+)/i),
    vBC_PIS: extrairNum(/Base\s+(?:de\s+Cálculo\s+)?PIS[:\s]+([\d.,]+)/i),
    vBC_COFINS: extrairNum(/Base\s+(?:de\s+Cálculo\s+)?COFINS[:\s]+([\d.,]+)/i),
  }]

  return {
    tipo: 'nfe',
    fontePDF: true,
    nNF,
    CFOP,
    natOp,
    cnpjEmit,
    cnpjDest,
    xNome_dest,
    UF_dest,
    cMun_dest: '',
    vProd,
    vICMS,
    vICMSST,
    vNF,
    vPIS_total,
    vCOFINS_total,
    nfsRef,
    infCpl,
    itens,
  }
}

function parsePdfEspelhoNFSe(text) {
  const t = text.replace(/\s+/g, ' ')
  function extrair(regex, grupo = 1) {
    const m = t.match(regex)
    return m ? (m[grupo] || '').trim() : ''
  }
  function extrairNum(regex, grupo = 1) {
    const s = extrair(regex, grupo).replace(/\./g, '').replace(',', '.')
    return parseFloat(s) || 0
  }

  const vServ = extrairNum(/Valor\s+(?:do\s+)?Serviço[s]?[:\s]+([\d.,]+)/i) ||
                extrairNum(/Valor\s+Total[:\s]+([\d.,]+)/i)
  const vISS = extrairNum(/Valor\s+(?:do\s+)?ISS[:\s]+([\d.,]+)/i)
  const pAliqISS = extrairNum(/Al[íi]quota\s+ISS[:\s]+([\d,]+)\s*%/i)

  const cnpjsAll = [...t.matchAll(/(\d{2}\.?\d{3}\.?\d{3}\/\d{4}-?\d{2})/g)].map(m => parseCNPJ(m[1]))
  const cnpjPrestador = cnpjsAll.find(c => c === GV_CNPJ) || cnpjsAll[0] || ''
  const cnpjTomador = cnpjsAll.find(c => c !== cnpjPrestador) || ''

  return {
    tipo: 'nfse',
    fontePDF: true,
    cNF: extrair(/N[ºo°]\s*(?:RPS|NFS[- ]?e?)?[:\s]*(\d+)/i),
    cTribNac: extrair(/(?:código|cód\.?)\s+tributa[çc][ãa]o\s+nacional[:\s]+(\d+)/i) ||
              extrair(/cTribNac[:\s]+(\d+)/i),
    cTribMun: extrair(/(?:código|cód\.?)\s+(?:tributa[çc][ãa]o\s+)?municipal[:\s]+(\d+)/i) ||
              extrair(/cTribMun[:\s]+(\d+)/i),
    cNBS: extrair(/(?:código\s+)?NBS[:\s]+([\d.]+)/i),
    cIndOp: extrair(/(?:código\s+)?(?:indicador\s+de\s+)?opera[çc][ãa]o[:\s]+(\d+)/i) ||
            extrair(/cIndOp[:\s]+(\d+)/i),
    cLocPrestacao: extrair(/(?:local\s+de\s+presta[çc][ãa]o|cLocPrestacao)[:\s]+(\d+)/i),
    vServ,
    vISS,
    pAliqISS,
    tpRetISSQN: extrair(/tpRetISSQN[:\s]+(\d+)/i),
    CST_PIS: extrair(/CST\s+PIS[:\s]+(\d{2})/i),
    pPIS: extrairNum(/Al[íi]quota\s+PIS[:\s]+([\d,]+)/i),
    vPIS: extrairNum(/Valor\s+PIS[:\s]+([\d.,]+)/i),
    CST_COFINS: extrair(/CST\s+COFINS[:\s]+(\d{2})/i),
    pCOFINS: extrairNum(/Al[íi]quota\s+COFINS[:\s]+([\d,]+)/i),
    vCOFINS: extrairNum(/Valor\s+COFINS[:\s]+([\d.,]+)/i),
    tpRetPisCofins: extrair(/tpRetPisCofins[:\s]+(\d+)/i),
    vIBS: extrairNum(/Valor\s+IBS[:\s]+([\d.,]+)/i),
    vCBS: extrairNum(/Valor\s+CBS[:\s]+([\d.,]+)/i),
    CST_IBS: extrair(/CST\s+IBS[:\s]+(\d+)/i),
    cClassTrib: extrair(/cClassTrib[:\s]+(\d+)/i),
    cnpjPrestador,
    cnpjTomador,
  }
}

// Detecta se o PDF parece NFS-e ou NF-e pelo conteúdo do texto
function detectarTipoPDF(text) {
  const t = text.toLowerCase()
  if (t.includes('nfs-e') || t.includes('nota fiscal de serviço') || t.includes('iss') || t.includes('serviço prestado')) return 'nfse'
  if (t.includes('nf-e') || t.includes('nota fiscal eletrônica') || t.includes('icms') || t.includes('danfe') || t.includes('espelho')) return 'nfe'
  // fallback: se tem CFOP, é NF-e
  if (/\b[56]\d{3}\b/.test(text)) return 'nfe'
  return 'nfe'
}

// ── DropZone ──────────────────────────────────────────────────────────────────
function DropZone({ label, onFile, onPdf, fileName, color = '#3B82F6', accept = '.xml,.pdf' }) {
  const ref = useRef()
  const [over, setOver] = useState(false)
  const [loading, setLoading] = useState(false)

  async function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'pdf') {
      if (!onPdf) { alert('Esta seção aceita apenas XML.'); return }
      setLoading(true)
      try {
        const buf = await file.arrayBuffer()
        const text = await extractPdfText(buf)
        onPdf(text, file.name)
      } catch (e) { onPdf(null, file.name, e.message) }
      finally { setLoading(false) }
    } else {
      const reader = new FileReader()
      reader.onload = e => onFile(e.target.result, file.name)
      reader.readAsText(file, 'UTF-8')
    }
  }

  const hasFile = !!fileName
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
      onClick={() => ref.current.click()}
      style={{
        border: `2px dashed ${over ? color : hasFile ? color : 'var(--border-2)'}`,
        borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer',
        transition: 'all .2s',
        background: over ? `color-mix(in srgb, ${color} 8%, white)` : hasFile ? `color-mix(in srgb, ${color} 5%, white)` : 'var(--bg-2)',
        minHeight: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      <input type="file" accept={accept} ref={ref} style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]) }} />
      {loading ? (
        <>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="var(--border-2)" strokeWidth="2.5" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Lendo PDF…</div>
        </>
      ) : hasFile ? (
        <>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="11" fill={`color-mix(in srgb, ${color} 18%, white)`} />
            <path d="M6 11l3.5 3.5L16 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 12, fontWeight: 600, color }}>{fileName}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>Clique para trocar</div>
        </>
      ) : (
        <>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="5" fill="var(--bg-3)" />
            <path d="M14 9v10M9 14l5-5 5 5" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>XML ou PDF · clique ou arraste</div>
        </>
      )}
    </div>
  )
}

// ── Linha de veredicto ────────────────────────────────────────────────────────
function VeredItem({ item }) {
  const [open, setOpen] = useState(false)
  const hasDetail = !!(item.esperado || item.explicacao)

  const cfg = {
    ok:    { bg: 'var(--green-bg)', border: '#86EFAC', icon: '✅', textColor: 'var(--green-text)', label: 'Correto' },
    erro:  { bg: 'var(--red-bg)',   border: '#FCA5A5', icon: '❌', textColor: 'var(--red-text)',   label: 'Erro' },
    aviso: { bg: 'var(--yellow-bg)',border: '#FDE68A', icon: '⚠️', textColor: 'var(--yellow-text)',label: 'Atenção' },
  }[item.status] || {}

  return (
    <div style={{
      border: `1px solid ${cfg.border}`, borderRadius: 8, marginBottom: 4, overflow: 'hidden',
      background: cfg.bg,
    }}>
      <div
        style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', cursor: hasDetail ? 'pointer' : 'default' }}
        onClick={() => hasDetail && setOpen(o => !o)}
      >
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.textColor, textTransform: 'uppercase', letterSpacing: '.05em' }}>{item.campo}</span>
            {item.encontrado && (
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', background: 'rgba(0,0,0,.06)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-2)' }}>
                {item.encontrado}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 2, lineHeight: 1.5 }}>{item.mensagem}</div>
        </div>
        {hasDetail && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3, transition: 'transform .15s', transform: open ? 'rotate(180deg)' : '' }}>
            <path d="M3 5l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {open && hasDetail && (
        <div style={{ padding: '0 12px 12px 36px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
          {item.esperado && (
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-3)' }}>Esperado: </span>
              <span style={{ fontFamily: 'DM Mono, monospace' }}>{item.esperado}</span>
            </div>
          )}
          {item.explicacao && <div>{item.explicacao}</div>}
        </div>
      )}
    </div>
  )
}

// ── Painel de auditoria ───────────────────────────────────────────────────────
function PainelAuditoria({ dados, cenarioInfo, fileName }) {
  const veredictos = auditar(dados, cenarioInfo?.cenario)
  const erros  = veredictos.filter(v => v.status === 'erro')
  const avisos = veredictos.filter(v => v.status === 'aviso')
  const oks    = veredictos.filter(v => v.status === 'ok')
  const total  = veredictos.length
  const pct    = total > 0 ? Math.round((oks.length / total) * 100) : 0

  // Info básica da nota
  const nNota = dados.tipo === 'nfse' ? dados.cNF : dados.nNF
  const uf = dados.UF_dest || ''
  const valorStr = dados.tipo === 'nfse' ? fmtMoeda(dados.vServ) : fmtMoeda(dados.vNF)

  const statusGeral = erros.length > 0 ? 'erro' : avisos.length > 0 ? 'aviso' : 'ok'
  const corGeral = { erro: 'var(--red)', aviso: '#F59E0B', ok: 'var(--green)' }[statusGeral]
  const labelGeral = { erro: `${erros.length} erro${erros.length>1?'s':''}`, aviso: `${avisos.length} atenção`, ok: 'Tudo correto' }[statusGeral]

  const [expandOk, setExpandOk] = useState(false)

  return (
    <div style={{ background: '#fff', border: `1px solid ${corGeral}`, borderLeft: `4px solid ${corGeral}`, borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginTop: 16 }}>

      {/* Header */}
      <div style={{ padding: '14px 16px', background: statusGeral === 'ok' ? 'var(--green-bg)' : statusGeral === 'erro' ? 'var(--red-bg)' : 'var(--yellow-bg)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{cenarioInfo?.label || 'Análise fiscal'}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: corGeral, background: 'rgba(255,255,255,.6)', padding: '2px 8px', borderRadius: 20 }}>
                {labelGeral}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
              {[nNota && `Nº ${nNota}`, uf, valorStr, fileName].filter(Boolean).join(' · ')}
            </div>
          </div>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{oks.length}/{total}</span>
            <div style={{ width: 80, height: 6, background: 'rgba(0,0,0,.1)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: corGeral, borderRadius: 10, transition: 'width .4s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div style={{ padding: '14px 16px' }}>

        {/* Erros */}
        {erros.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--red-text)', marginBottom: 6 }}>
              ❌ Erros ({erros.length})
            </div>
            {erros.map((v, i) => <VeredItem key={i} item={v} />)}
          </div>
        )}

        {/* Avisos */}
        {avisos.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--yellow-text)', marginBottom: 6 }}>
              ⚠️ Atenção ({avisos.length})
            </div>
            {avisos.map((v, i) => <VeredItem key={i} item={v} />)}
          </div>
        )}

        {/* OKs colapsáveis */}
        {oks.length > 0 && (
          <div>
            <button
              onClick={() => setExpandOk(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: expandOk ? 8 : 0 }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--green-text)' }}>
                ✅ Corretos ({oks.length})
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform .15s', transform: expandOk ? 'rotate(180deg)' : '' }}>
                <path d="M2 4l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {expandOk && oks.map((v, i) => <VeredItem key={i} item={v} />)}
          </div>
        )}

        {veredictos.length === 0 && (
          <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
            Cenário "{cenarioInfo?.cenario}" não tem regras específicas implementadas ainda.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Catálogo de tipos de nota ─────────────────────────────────────────────────
const TIPOS_NOTA = [
  { id: 'nfse_manutencao', label: 'NFS-e — Manutenção / Conserto serviço', cor: '#3B82F6', tipoDados: 'nfse', desc: 'Serviço de manutenção preventiva ou corretiva' },
  { id: 'comissao',        label: 'NFS-e — Comissão Kaeser',               cor: '#7C3AED', tipoDados: 'nfse', desc: 'Representação comercial, cTribNac 100901' },
  { id: 'oleo',            label: 'NF-e — Venda de Óleo / Lubrificante',   cor: '#F97316', tipoDados: 'nfe',  desc: 'CFOP 5405 (SP) ou 6403 (outros estados)' },
  { id: 'oleo_remessa',    label: 'NF-e — Óleo Remessa Futura',            cor: '#0D9488', tipoDados: 'nfe',  desc: 'CFOP 6117, CST 041, sem ST antecipado' },
  { id: 'pecas',           label: 'NF-e — Peças / Filtros',                cor: '#0891B2', tipoDados: 'nfe',  desc: 'CFOP 6102 ou 5102, NCM 8421' },
  { id: 'conserto_remessa',label: 'NF-e — Conserto: Entrada (5915)',        cor: '#F59E0B', tipoDados: 'nfe',  desc: 'Equipamento recebido para conserto' },
  { id: 'conserto_retorno',label: 'NF-e — Conserto: Retorno (5916)',        cor: '#F59E0B', tipoDados: 'nfe',  desc: 'Equipamento devolvido após conserto' },
]

// ── Seletor de tipo de nota ────────────────────────────────────────────────────
function SeletorTipo({ tipoSelecionado, onSelecionar }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
        1. Escolha o tipo da nota
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {TIPOS_NOTA.map(t => {
          const ativo = tipoSelecionado === t.id
          return (
            <button
              key={t.id}
              onClick={() => onSelecionar(ativo ? null : t.id)}
              title={t.desc}
              style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: ativo ? 700 : 400,
                border: `1.5px solid ${ativo ? t.cor : 'var(--border-2)'}`,
                background: ativo ? `color-mix(in srgb, ${t.cor} 12%, white)` : '#fff',
                color: ativo ? t.cor : 'var(--text-2)',
                cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
              }}
            >
              {ativo && <span style={{ marginRight: 4 }}>✓</span>}
              {t.label}
            </button>
          )
        })}
      </div>
      {!tipoSelecionado && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
          Selecione o tipo antes de carregar o arquivo.
        </div>
      )}
    </div>
  )
}

// ── Upload com tipo fixo ────────────────────────────────────────────────────────
function UploadCard({ slot, tipoId, onChange }) {
  const [err, setErr] = useState('')
  const [fileName, setFileName] = useState(null)

  const tipoInfo = TIPOS_NOTA.find(t => t.id === tipoId)
  const cor = tipoInfo?.cor || '#3B82F6'

  // Monta cenarioInfo fixo a partir do tipo selecionado — sem adivinhação
  function cenarioDoTipo(tipo) {
    return tipo ? { cenario: tipo.id, label: tipo.label, cor: tipo.cor } : null
  }

  function handleXML(xml, name) {
    setErr('')
    setFileName(name)
    try {
      let dados
      if (tipoInfo?.tipoDados === 'nfse') {
        dados = parseNFSe(xml)
      } else {
        dados = parseNFe(xml)
      }
      onChange({ dados, cenarioInfo: cenarioDoTipo(tipoInfo), fileName: name, tipo: dados.tipo })
    } catch (e) {
      setErr('Arquivo inválido: ' + e.message)
      setFileName(null)
      onChange(null)
    }
  }

  function handlePDF(text, name, errMsg) {
    setErr('')
    if (errMsg || !text) {
      setErr('Erro ao ler PDF: ' + (errMsg || 'arquivo inválido'))
      setFileName(null)
      onChange(null)
      return
    }
    setFileName(name)
    try {
      let dados
      if (tipoInfo?.tipoDados === 'nfse') {
        dados = parsePdfEspelhoNFSe(text)
      } else {
        dados = parsePdfEspelhoNFe(text)
      }
      onChange({ dados, cenarioInfo: cenarioDoTipo(tipoInfo), fileName: name, tipo: dados.tipo, fontePDF: true })
    } catch (e) {
      setErr('Erro ao processar espelho PDF: ' + e.message)
      setFileName(null)
      onChange(null)
    }
  }

  if (!tipoId) return null

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
        2. Carregue o espelho (PDF) ou XML
      </div>
      <DropZone
        label={`Nota ${slot} — ${tipoInfo?.label || ''}`}
        onFile={handleXML}
        onPdf={handlePDF}
        fileName={fileName}
        color={cor}
        accept=".pdf,.xml"
      />
      {err && (
        <div style={{ marginTop: 6, padding: '6px 10px', background: 'var(--red-bg)', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 12, color: 'var(--red-text)' }}>
          {err}
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Conferidor() {
  // Cada slot: { tipo: tipoId, resultado: { dados, cenarioInfo, fileName, ... } | null }
  const [slots, setSlots] = useState([
    { tipo: null, resultado: null },
    { tipo: null, resultado: null },
  ])

  function setSlotTipo(i, tipo) {
    setSlots(prev => {
      const s = [...prev]
      s[i] = { tipo, resultado: null } // limpa resultado ao trocar tipo
      return s
    })
  }

  function setSlotResultado(i, resultado) {
    setSlots(prev => {
      const s = [...prev]
      s[i] = { ...s[i], resultado }
      return s
    })
  }

  function addSlot() {
    setSlots(prev => [...prev, { tipo: null, resultado: null }])
  }

  function removeSlot(i) {
    setSlots(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)' }}>
      <Nav />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Conferidor Fiscal</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '6px 0 0' }}>
            Escolha o tipo da nota, carregue o <strong>espelho PDF</strong> do Omie (antes da emissão) ou o XML pós-emissão — cada campo é auditado contra as regras fiscais da Gera Vale.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {[['❌', 'Erros'], ['⚠️', 'Atenção'], ['✅', 'Correto']].map(([ic, l], i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>{ic} {l}</div>
            ))}
          </div>
        </div>

        {/* Slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {slots.map((slot, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', boxShadow: 'var(--shadow-sm)' }}>

              {/* Cabeçalho do slot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  Nota {i + 1}
                  {slot.resultado?.cenarioInfo && (
                    <span style={{ marginLeft: 8, fontWeight: 500, color: slot.resultado.cenarioInfo.cor, fontSize: 12 }}>
                      — {slot.resultado.cenarioInfo.label}
                    </span>
                  )}
                </span>
                {i >= 2 && (
                  <button onClick={() => removeSlot(i)} style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Remover
                  </button>
                )}
              </div>

              {/* Seletor de tipo */}
              <SeletorTipo tipoSelecionado={slot.tipo} onSelecionar={tipo => setSlotTipo(i, tipo)} />

              {/* Upload (só aparece após escolher tipo) */}
              <UploadCard
                slot={i + 1}
                tipoId={slot.tipo}
                onChange={resultado => setSlotResultado(i, resultado)}
              />

              {/* Aviso fonte PDF */}
              {slot.resultado?.fontePDF && (
                <div style={{ marginTop: 10, padding: '7px 12px', background: 'var(--blue-bg)', border: '1px solid var(--blue)', borderRadius: 7, fontSize: 12, color: 'var(--blue-text)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>📄</span>
                  <span>Campos extraídos do espelho PDF. Para máxima precisão, confira o XML pós-emissão.</span>
                </div>
              )}

              {/* Painel de auditoria */}
              {slot.resultado?.dados && slot.resultado?.cenarioInfo && (
                <PainelAuditoria
                  dados={slot.resultado.dados}
                  cenarioInfo={slot.resultado.cenarioInfo}
                  fileName={slot.resultado.fileName}
                />
              )}
            </div>
          ))}
        </div>

        {/* Botão adicionar nota */}
        <button
          onClick={addSlot}
          style={{
            marginTop: 24, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
            fontSize: 13, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer',
            transition: 'border-color .15s, color .15s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Adicionar outra nota para conferência
        </button>

        {/* Nota de rodapé */}
        <div style={{ marginTop: 32, padding: '12px 16px', background: 'var(--bg-3)', borderRadius: 8, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-2)' }}>Como funciona:</strong> Escolha o tipo da nota, depois carregue o espelho PDF do Omie
          <em> antes da emissão</em> (ou o XML pós-emissão). O Conferidor cruza cada campo com as regras
          fiscais da Gera Vale e sinaliza inconsistências. Clique em qualquer linha para ver o detalhe.
        </div>

      </div>
    </div>
  )
}
