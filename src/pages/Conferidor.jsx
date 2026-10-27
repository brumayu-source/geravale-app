import React, { useState, useRef } from 'react'
import Nav from '../components/Nav'

// ── Constantes ────────────────────────────────────────────────────────────────
const GV_CNPJ = '19090416000176'
const SJC_IBGE = '3549904'

// ── Helpers XML ───────────────────────────────────────────────────────────────
function getTag(node, tag) {
  const els = node.getElementsByTagName(tag)
  return els.length > 0 ? els[0].textContent.trim() : ''
}
function getAllTags(node, tag) {
  return Array.from(node.getElementsByTagName(tag))
}
function parseCNPJ(s) { return s.replace(/\D/g, '') }
function fmtMoeda(v) {
  const n = parseFloat(v) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtNum(v, dec = 2) {
  return (parseFloat(v) || 0).toFixed(dec).replace('.', ',')
}

// ── Parser NFS-e Nacional (DPS/infDPS) ────────────────────────────────────────
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

// ── Parser NF-e ───────────────────────────────────────────────────────────────
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

  // Extrai NF(s) referenciada(s) — campo NFref/refNFe/chNFe
  const nfeRefs = getAllTags(doc, 'NFref')
  const nfsRef = nfeRefs.map(r => {
    const chNFe = getTag(r, 'refNFe')
    const nRef = getTag(r, 'nNF')
    const serieRef = getTag(r, 'serie')
    const cnpjRef = getTag(r, 'CNPJ')
    return { chNFe, nRef, serieRef, cnpjRef }
  }).filter(r => r.chNFe || r.nRef)

  // Também tenta infAdic para NF referenciada nas obs (fallback texto)
  const infCpl = getTag(doc, 'infCpl')

  return {
    tipo: 'nfe',
    chave: infNFe.getAttribute('Id') || '',
    nNF: getTag(ide, 'nNF'),
    CFOP: getTag(dets[0]?.getElementsByTagName('prod')[0] || doc, 'CFOP'),
    natOp: getTag(ide, 'natOp'),
    cnpjEmit: parseCNPJ(getTag(emit, 'CNPJ')),
    cnpjDest: parseCNPJ(getTag(dest, 'CNPJ')),
    UF_dest: getTag(dest, 'UF') || getTag(doc, 'UF'),
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

// ── Parser PDF (espelho NF) ───────────────────────────────────────────────────
async function extractPdfText(arrayBuffer) {
  // Carrega pdf.js via CDN se ainda não carregado
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

function parsePdfEspelho(text, nome) {
  // Extrai campos do espelho da NF por regex no texto
  const get = (regex, fallback = '') => {
    const m = text.match(regex)
    return m ? m[1].trim() : fallback
  }
  const getAll = regex => {
    const all = []
    let m
    const re = new RegExp(regex.source, regex.flags)
    while ((m = re.exec(text)) !== null) all.push(m[1].trim())
    return all
  }

  // Detecta tipo de nota
  const isNFSe = /NFS-e|Nota Fiscal de Servi/i.test(text)
  const isNFe = /NF-e|Nota Fiscal Eletr/i.test(text)

  if (isNFSe) {
    return {
      tipo: 'pdf_nfse',
      fonte: nome,
      numero: get(/(?:N[úu]mero|N[°º]\.?)\s*[:\-]?\s*(\d+)/i),
      cnpjPrestador: get(/(?:CNPJ|CPF\/CNPJ)[^0-9]*([0-9]{2}[\.\-]?[0-9]{3}[\.\-]?[0-9]{3}[\/\-]?[0-9]{4}[\-]?[0-9]{2})/),
      valorServico: get(/(?:Valor\s+do\s+Servi[çc]o|vServ)[^R$0-9]*R?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})/i),
      iss: get(/ISS[^0-9R$]*(?:R?\$\s*)?([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})/i),
      aliqISS: get(/(?:Al[íi]quota\s+ISS|ISS\s*%)[^0-9]*([0-9]+[.,][0-9]+)\s*%?/i),
      cIndOp: get(/(?:cIndOp|Indicador\s+de\s+Opera[çc][ãa]o)[^0-9]*([0-9]{6})/i),
      cTribNac: get(/(?:cTribNac|C[óo]digo\s+Tribut)[^0-9]*([0-9]{6})/i),
      locPrestacao: get(/(?:Local\s+de\s+Presta[çc][ãa]o|cLocPrest)[^0-9]*([0-9]{7})/i),
      pisCofins: get(/(?:PIS|PIS\/COFINS)[^0-9R$]*(?:R?\$\s*)?([0-9]+[.,][0-9]{2})/i),
      texto: text.substring(0, 2000),
    }
  }

  if (isNFe) {
    // Extrai CNPJ — tenta primeiro emitente depois destinatário
    const cnpjs = getAll(/([0-9]{2}[\.\-]?[0-9]{3}[\.\-]?[0-9]{3}[\/\-]?[0-9]{4}[\-]?[0-9]{2})/g)
    const cnpjEmit = cnpjs[0] || ''
    const cnpjDest = cnpjs[1] || ''

    // Transportadora — vários formatos nos espelhos
    const transp = get(/(?:Raz[ãa]o\s+Social\s+Transp|Transportadora|Nome\s+Transp)[^a-zA-Z]*([A-Za-záàâãéèêíìîóòôõúùûçÁÀÂÃÉÊÍÓÔÕÚÇ][A-Za-z\s\d\.]{3,50})/i)
    const cnpjTransp = get(/(?:CNPJ\s+Transp|Transp.*CNPJ)[^0-9]*([0-9]{2}[\.\-]?[0-9]{3}[\.\-]?[0-9]{3}[\/\-]?[0-9]{4}[\-]?[0-9]{2})/i)

    // Peso, volumes, espécie
    const pesoBruto = get(/(?:Peso\s+Bruto|Peso\s+Liq)[^0-9]*([0-9]+[.,][0-9]{1,3})/i)
    const volumes = get(/(?:Qtde\s+Vol[ue]|N[°º]\s+Vol[ue]|Quantidade\s+de\s+Volume)[^0-9]*([0-9]+)/i)
    const especie = get(/(?:Esp[eé]cie)[^a-zA-Z]*([A-Za-z]{2,20})/i)

    return {
      tipo: 'pdf_nfe',
      fonte: nome,
      numero: get(/(?:N[úu]mero|N[°º]\.?|NF-e\s+n[°º]?)[^0-9]*([0-9]+)/i),
      serie: get(/S[eé]rie[^0-9]*([0-9]+)/i),
      chave: get(/Chave\s+de\s+acesso[^0-9]*([0-9\s]{44,})/i, '').replace(/\s/g, ''),
      cfop: get(/CFOP[^0-9]*([0-9]\.[0-9]{3})/i),
      ncm: getAll(/NCM[^0-9]*([0-9]{4}\.?[0-9]{2}\.?[0-9]{2})/gi)[0] || '',
      cest: get(/CEST[^0-9]*([0-9]{2}\.?[0-9]{3}\.?[0-9]{2})/i),
      natOp: get(/(?:Natureza\s+da\s+Opera[çc][ãa]o|Nat\.\s+Op)[^a-zA-Z]*([A-Za-záàâãéèêíìîóòôõúùûçÁÀÂÃÉÊÍÓÔÕÚÇ][^\n]{5,60})/i),
      cnpjEmit: cnpjEmit,
      cnpjDest: cnpjDest,
      ufDest: get(/(?:UF\s+Dest[^a-z]|Estado\s+Dest)[^A-Z]*([A-Z]{2})/i),
      valorProd: get(/(?:Valor\s+Total\s+Produtos|vProd|Tot[,.]?\s*Prod)[^R$0-9]*(?:R?\$\s*)?([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})/i),
      valorICMS: get(/(?:Valor\s+ICMS\b|vICMS)[^R$0-9]*(?:R?\$\s*)?([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})/i),
      valorICMSST: get(/(?:ICMS.ST|Substitui[çc][ãa]o)[^R$0-9]*(?:R?\$\s*)?([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})/i),
      valorTotal: get(/(?:Valor\s+Total\s+NF|Total\s+da\s+Nota|Total\s+NF)[^R$0-9]*(?:R?\$\s*)?([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})/i),
      transp: transp,
      cnpjTransp: cnpjTransp,
      pesoBruto: pesoBruto,
      volumes: volumes,
      especie: especie,
      texto: text.substring(0, 2000),
    }
  }

  return {
    tipo: 'pdf_generico',
    fonte: nome,
    texto: text.substring(0, 3000),
  }
}

// ── Verificadores ─────────────────────────────────────────────────────────────
function verificarNFSe(n) {
  const erros = [], avisos = [], ok = []

  if (n.cTribNac === '140101') ok.push('cTribNac 140101 — Serviços de conservação e manutenção ✓')
  else if (n.cTribNac === '100901') ok.push('cTribNac 100901 — Comissão ✓')
  else erros.push(`cTribNac "${n.cTribNac}" inesperado — esperado 140101 (manutenção) ou 100901 (comissão)`)

  if (n.cTribMun === '0068' || n.cTribMun === '068') ok.push('cTribMun 0068 — Manutenção e conservação de máquinas ✓')
  else erros.push(`cTribMun "${n.cTribMun}" — esperado 0068`)

  if (n.cNBS) ok.push(`cNBS ${n.cNBS} presente`)
  else avisos.push('cNBS ausente')

  const indOpsValidos = ['050101', '050102', '050103', '050104', '100301']
  if (indOpsValidos.includes(n.cIndOp)) ok.push(`cIndOp ${n.cIndOp} ✓`)
  else erros.push(`cIndOp "${n.cIndOp}" inválido — esperado: ${indOpsValidos.join(', ')}`)

  const locNorm = (n.cLocPrestacao || '').replace(/^0+/, '')
  const sjcNorm = SJC_IBGE.replace(/^0+/, '')
  if (locNorm === sjcNorm) ok.push('Local de prestação: São José dos Campos ✓')
  else avisos.push(`cLocPrestacao "${n.cLocPrestacao}" — verifique se é SJC (${SJC_IBGE})`)

  if (n.pAliqISS === 3 || Math.abs(n.pAliqISS - 3) < 0.01) ok.push(`Alíquota ISS 3% ✓`)
  else if (n.pAliqISS > 0) erros.push(`Alíquota ISS ${fmtNum(n.pAliqISS)}% — esperado 3%`)

  if (n.tpRetISSQN === '1') ok.push('tpRetISSQN = 1 (retido pelo tomador) ✓')
  else if (n.tpRetISSQN) avisos.push(`tpRetISSQN = ${n.tpRetISSQN} — verifique retenção`)

  if (n.CST_PIS === '01') ok.push(`PIS CST 01 ✓ — ${fmtNum(n.pPIS, 2)}%`)
  else if (n.CST_PIS) erros.push(`PIS CST "${n.CST_PIS}" — esperado 01`)

  if (n.CST_COFINS === '01') ok.push(`COFINS CST 01 ✓ — ${fmtNum(n.pCOFINS, 2)}%`)
  else if (n.CST_COFINS) erros.push(`COFINS CST "${n.CST_COFINS}" — esperado 01`)

  if (n.tpRetPisCofins === '3') ok.push('tpRetPisCofins = 3 — retenção 4,65% ✓')
  else if (n.tpRetPisCofins) avisos.push(`tpRetPisCofins = ${n.tpRetPisCofins} — verifique retenção`)

  if (n.vIBS > 0 || n.vCBS > 0) {
    if (n.CST_IBS === '000') ok.push('IBS/CBS CST 000 ✓')
    else erros.push(`IBS/CBS CST "${n.CST_IBS}" — esperado 000`)
    if (n.cClassTrib === '000001') ok.push('cClassTrib 000001 ✓')
    else erros.push(`cClassTrib "${n.cClassTrib}" — esperado 000001`)
  }

  return { erros, avisos, ok }
}

function verificarNFe(nfe, tipo) {
  const erros = [], avisos = [], ok = []
  const cfopsVistos = [...new Set(nfe.itens.map(i => i.CFOP))]

  if (tipo === 'oleo') {
    const cfopOk = cfopsVistos.some(c => ['5405', '6403'].includes(c))
    if (cfopOk) ok.push(`CFOP ${cfopsVistos.join(', ')} — óleo/lubrificante ✓`)
    else erros.push(`CFOP ${cfopsVistos.join(', ')} — esperado 5405 (SP) ou 6403 (interestadual)`)
  } else if (tipo === 'oleo_remessa') {
    const cfopOk = cfopsVistos.some(c => ['6117'].includes(c))
    if (cfopOk) ok.push(`CFOP ${cfopsVistos.join(', ')} — remessa p/ entrega futura ✓`)
    else erros.push(`CFOP ${cfopsVistos.join(', ')} — esperado 6117 (remessa por conta e ordem p/ entrega futura)`)
    // Verifica NF de origem referenciada
    if (nfe.nfsRef && nfe.nfsRef.length > 0) {
      const ref = nfe.nfsRef[0]
      if (ref.chNFe) ok.push(`NF de origem referenciada (chave: …${ref.chNFe.slice(-8)}) ✓`)
      else if (ref.nRef) ok.push(`NF de origem referenciada: série ${ref.serieRef} nº ${ref.nRef} ✓`)
    } else {
      // Fallback: verifica se infCpl menciona NF de origem
      const mencaoNF = nfe.infCpl && /(?:NF-e\s+Ref|NF\s+origem|serie.*numero|nNF)/i.test(nfe.infCpl)
      if (mencaoNF) ok.push(`NF de origem citada nas informações complementares ✓`)
      else erros.push(`NF de origem não referenciada — obrigatório para CFOP 6117 (remessa p/ entrega futura)`)
    }
    // Verifica menção ao fundamento legal nas infos complementares
    const temFundamento = nfe.infCpl && /art\.?\s*7[°º]|RICMS|Decreto.*45\.490|n[ãa]o\s+incid/i.test(nfe.infCpl)
    if (temFundamento) ok.push(`Fundamentação legal (não incidência ICMS) presente nas obs. complementares ✓`)
    else avisos.push(`Recomendado: mencionar "art. 7º, XIV, RICMS/SP (Dec. 45.490/2000)" nas informações complementares`)
  } else if (tipo === 'pecas') {
    const cfopOk = cfopsVistos.some(c => ['6102', '5102'].includes(c))
    if (cfopOk) ok.push(`CFOP ${cfopsVistos.join(', ')} — venda de peças/filtros ✓`)
    else erros.push(`CFOP ${cfopsVistos.join(', ')} — esperado 6102 (interestadual) ou 5102 (SP)`)
  } else if (tipo === 'conserto_saida') {
    const cfopOk = cfopsVistos.some(c => ['5916', '6916'].includes(c))
    if (cfopOk) ok.push(`CFOP ${cfopsVistos.join(', ')} — retorno de conserto ✓`)
    else erros.push(`CFOP ${cfopsVistos.join(', ')} — esperado 5916 (SP) ou 6916 (outro estado)`)
  } else if (tipo === 'conserto_entrada') {
    const cfopOk = cfopsVistos.some(c => ['5915', '6915'].includes(c))
    if (cfopOk) ok.push(`CFOP ${cfopsVistos.join(', ')} — remessa para conserto ✓`)
    else erros.push(`CFOP ${cfopsVistos.join(', ')} — esperado 5915 (SP) ou 6915 (outro estado)`)
  }

  nfe.itens.forEach(item => {
    const prefix = `Item ${item.nItem} (${item.cProd})`

    if (tipo === 'oleo') {
      if (item.NCM === '34039900' || item.NCM === '3403.99.00') ok.push(`${prefix} NCM 3403.99.00 ✓`)
      else erros.push(`${prefix} NCM "${item.NCM}" — esperado 3403.99.00`)
      if (item.CEST === '0601700' || item.CEST === '06.017.00') ok.push(`${prefix} CEST 06.017.00 ✓`)
      else avisos.push(`${prefix} CEST "${item.CEST}" — esperado 06.017.00`)
      if (item.orig === '2') ok.push(`${prefix} Origem 2 ✓`)
      else erros.push(`${prefix} Origem "${item.orig}" — esperado 2`)
      if (Math.abs(item.pICMS - 4) < 0.01) ok.push(`${prefix} ICMS 4% ✓`)
      else if (item.pICMS > 0) erros.push(`${prefix} ICMS ${fmtNum(item.pICMS)}% — esperado 4%`)
      const stEsperado = { PE: 20.5, ES: 17, SP: 18 }[nfe.UF_dest] || null
      if (stEsperado !== null && item.pICMSST > 0) {
        if (Math.abs(item.pICMSST - stEsperado) < 0.1) ok.push(`${prefix} ICMS-ST ${fmtNum(item.pICMSST)}% para ${nfe.UF_dest} ✓`)
        else erros.push(`${prefix} ICMS-ST ${fmtNum(item.pICMSST)}% para ${nfe.UF_dest} — esperado ${stEsperado}%`)
      }
      const baseEsperada = item.vProd - item.vICMS
      if (item.vBC_PIS > 0 && Math.abs(item.vBC_PIS - baseEsperada) < 0.02) {
        ok.push(`${prefix} Base PIS/COFINS = vProd − ICMS ✓`)
      } else if (item.vBC_PIS > 0) {
        avisos.push(`${prefix} Base PIS/COFINS: calculado R$${fmtNum(baseEsperada)}, declarado R$${fmtNum(item.vBC_PIS)}`)
      }
    }

    if (tipo === 'oleo_remessa') {
      if (item.NCM === '34039900' || item.NCM === '3403.99.00') ok.push(`${prefix} NCM 3403.99.00 ✓`)
      else erros.push(`${prefix} NCM "${item.NCM}" — esperado 3403.99.00`)
      // CST 041 = monofásico, não incidência — ICMS deve ser 0
      if (item.CST_ICMS === '041' || item.CST_ICMS === '41') ok.push(`${prefix} CST ICMS 041 — monofásico não incidência ✓`)
      else if (item.CST_ICMS) erros.push(`${prefix} CST ICMS "${item.CST_ICMS}" — esperado 041 (monofásico, não incidência art. 7º XIV RICMS)`)
      if (item.vICMS === 0) ok.push(`${prefix} ICMS = R$ 0,00 (não incidência, imposto já recolhido na nota original) ✓`)
      else if (item.vICMS > 0) erros.push(`${prefix} ICMS R$${fmtNum(item.vICMS)} — deve ser R$ 0,00 (imposto já recolhido na NF de origem)`)
      if (item.vICMSST === 0) ok.push(`${prefix} ICMS-ST = R$ 0,00 ✓`)
      else erros.push(`${prefix} ICMS-ST R$${fmtNum(item.vICMSST)} — deve ser R$ 0,00`)
    }

    if (tipo === 'pecas') {
      // NCMs válidos para filtros Kaeser: 84219910, 84219999
      const ncmNorm = item.NCM.replace(/\./g, '')
      if (['84219910', '84219999', '84219900'].includes(ncmNorm)) ok.push(`${prefix} NCM ${item.NCM} — filtros/separadores ✓`)
      else avisos.push(`${prefix} NCM "${item.NCM}" — confirme se está no grupo 8421 (filtros/separadores)`)
      // CST 200 = origem 2, tributado normal
      if (item.CST_ICMS === '200' || item.CST_ICMS === '20') ok.push(`${prefix} CST ICMS 200 (origem 2, tributado normal) ✓`)
      else if (item.CST_ICMS) erros.push(`${prefix} CST ICMS "${item.CST_ICMS}" — esperado 200 (orig. 2, tributado normal)`)
      if (item.orig === '2') ok.push(`${prefix} Origem 2 (estrangeiro procedência conhecida) ✓`)
      else if (item.orig) erros.push(`${prefix} Origem "${item.orig}" — esperado 2`)
      if (Math.abs(item.pICMS - 4) < 0.01) ok.push(`${prefix} ICMS 4% (interestadual, orig. 2) ✓`)
      else if (item.pICMS > 0) erros.push(`${prefix} ICMS ${fmtNum(item.pICMS)}% — esperado 4% (interestadual, produto de origem estrangeira)`)
      if (item.vICMSST === 0) ok.push(`${prefix} ICMS-ST = R$ 0,00 (filtros não têm ST) ✓`)
      else if (item.vICMSST > 0) erros.push(`${prefix} ICMS-ST R$${fmtNum(item.vICMSST)} — deve ser R$ 0,00 (não há ST para filtros NCM 8421)`)
      if (item.vPIS + item.vCOFINS === 0) ok.push(`${prefix} PIS/COFINS = R$ 0,00 ✓`)
      else avisos.push(`${prefix} PIS R$${fmtNum(item.vPIS)} / COFINS R$${fmtNum(item.vCOFINS)} — confirme se isento`)
    }
  })
  return { erros, avisos, ok }
}

function verificarParConserto(entrada, saida) {
  if (!entrada || !saida) return null
  const erros = [], avisos = [], ok = []
  const itEnt = entrada.itens, itSai = saida.itens
  if (itEnt.length !== itSai.length) avisos.push(`Número de itens diferente: entrada ${itEnt.length}, saída ${itSai.length}`)
  itEnt.forEach(ie => {
    const is = itSai.find(x => x.cProd === ie.cProd)
    if (!is) erros.push(`Item ${ie.cProd} (${ie.xProd}) presente na entrada mas não na saída`)
    else if (Math.abs(ie.vProd - is.vProd) > 0.01) erros.push(`Item ${ie.cProd}: valor entrada R$${fmtNum(ie.vProd)} ≠ saída R$${fmtNum(is.vProd)}`)
    else ok.push(`Item ${ie.cProd} — valores entrada/saída conferem ✓`)
  })
  const cfopEnt = [...new Set(itEnt.map(i => i.CFOP))]
  const cfopSai = [...new Set(itSai.map(i => i.CFOP))]
  const parOk = cfopEnt.some(c => ['5915','6915'].includes(c)) && cfopSai.some(c => ['5916','6916'].includes(c))
  if (parOk) ok.push(`Par CFOP conserto: ${cfopEnt.join(',')} ↔ ${cfopSai.join(',')} ✓`)
  else erros.push(`Par CFOP inválido: ${cfopEnt.join(',')} ↔ ${cfopSai.join(',')}`)
  return { erros, avisos, ok }
}

// ── CheckResult ───────────────────────────────────────────────────────────────
function CheckResult({ erros, avisos, ok }) {
  if (!erros.length && !avisos.length && !ok.length) return null
  const total = ok.length + avisos.length + erros.length
  const score = ok.length
  const pct = Math.round((score / total) * 100)
  return (
    <div style={{ marginTop: 14 }}>
      {/* Barra de progresso */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <div style={{ flex:1, height:5, background:'var(--bg-3)', borderRadius:10, overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:10, transition:'width .4s',
            width: `${pct}%`,
            background: erros.length ? 'var(--red)' : avisos.length ? '#F59E0B' : 'var(--green)',
          }} />
        </div>
        <span style={{ fontSize:11, color:'var(--text-3)', whiteSpace:'nowrap' }}>
          {score}/{total} OK
        </span>
      </div>

      {erros.map((m, i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'7px 10px', marginBottom:4, background:'var(--red-bg)', border:'1px solid #FCA5A5', borderRadius:7 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0, marginTop:1 }}>
            <circle cx="7" cy="7" r="7" fill="#FCA5A5"/>
            <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize:12, color:'var(--red-text)', lineHeight:1.5 }}>{m}</span>
        </div>
      ))}
      {avisos.map((m, i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'7px 10px', marginBottom:4, background:'var(--yellow-bg)', border:'1px solid #FDE68A', borderRadius:7 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0, marginTop:1 }}>
            <path d="M7 1L13 12.5H1L7 1Z" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1"/>
            <path d="M7 5.5v3M7 10v.5" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize:12, color:'var(--yellow-text)', lineHeight:1.5 }}>{m}</span>
        </div>
      ))}
      {ok.map((m, i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'6px 10px', marginBottom:3, background:'var(--green-bg)', borderRadius:7 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0, marginTop:1 }}>
            <circle cx="7" cy="7" r="7" fill="#BBF7D0"/>
            <path d="M4 7l2.5 2.5L10 5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize:12, color:'var(--green-text)', lineHeight:1.5 }}>{m}</span>
        </div>
      ))}
    </div>
  )
}

// ── DropZone (XML + PDF) ──────────────────────────────────────────────────────
function DropZone({ label, onFile, onPdf, fileName, color = 'var(--blue)', accept = '.xml,.pdf' }) {
  const ref = useRef()
  const [over, setOver] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleDrop(e) {
    e.preventDefault(); setOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  async function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'pdf') {
      if (!onPdf) { alert('Esta seção não aceita PDF, apenas XML.'); return }
      setLoading(true)
      try {
        const buf = await file.arrayBuffer()
        const text = await extractPdfText(buf)
        onPdf(text, file.name)
      } catch (e) {
        onPdf(null, file.name, e.message)
      } finally {
        setLoading(false)
      }
    } else {
      const reader = new FileReader()
      reader.onload = e => onFile(e.target.result, file.name)
      reader.readAsText(file, 'UTF-8')
    }
  }

  const aceitaPdf = !!onPdf
  const hasFile = !!fileName

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={() => ref.current.click()}
      style={{
        border: `2px dashed ${over ? color : hasFile ? color : 'var(--border-2)'}`,
        borderRadius: 12,
        padding: '20px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color .2s, background .2s, box-shadow .2s',
        background: over ? `color-mix(in srgb, ${color} 8%, white)` : hasFile ? `color-mix(in srgb, ${color} 5%, white)` : 'var(--bg-2)',
        boxShadow: over ? `0 0 0 4px color-mix(in srgb, ${color} 15%, transparent)` : 'none',
        minHeight: 88,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
    >
      <input type="file" accept={accept} ref={ref} style={{ display:'none' }}
        onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]) }} />
      {loading ? (
        <>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ animation:'spin 1s linear infinite' }}>
            <circle cx="12" cy="12" r="10" stroke="var(--border-2)" strokeWidth="2.5"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div style={{ fontSize:12, color:'var(--text-2)' }}>Lendo PDF…</div>
        </>
      ) : hasFile ? (
        <>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="11" fill={`color-mix(in srgb, ${color} 18%, white)`}/>
            <path d="M6 11l3.5 3.5L16 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontSize:12, fontWeight:600, color }}>Arquivo carregado</div>
          <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'DM Mono, monospace', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{fileName}</div>
          <div style={{ fontSize:10, color:'var(--text-3)' }}>Clique para trocar</div>
        </>
      ) : (
        <>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="20" height="20" rx="5" fill="var(--bg-3)"/>
            <path d="M14 9v10M9 14l5-5 5 5" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontSize:13, color:'var(--text-2)', fontWeight:500 }}>{label}</div>
          <div style={{ fontSize:11, color:'var(--text-3)' }}>
            {aceitaPdf ? 'XML ou PDF (espelho) · clique ou arraste' : 'XML · clique ou arraste'}
          </div>
        </>
      )}
    </div>
  )
}

// ── Pill de campo ─────────────────────────────────────────────────────────────
function Campo({ label, value, mono }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <span style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:500, color:'var(--text)', fontFamily: mono ? 'DM Mono, monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}

// ── Painéis de conferência ────────────────────────────────────────────────────
function PainelNFSe({ dados }) {
  const res = verificarNFSe(dados)
  const temErros = res.erros.length > 0
  return (
    <div style={{
      background:'#fff', border:`1px solid ${temErros ? '#FCA5A5' : 'var(--border)'}`,
      borderLeft: `4px solid ${temErros ? 'var(--red)' : 'var(--green)'}`,
      borderRadius:10, padding:16, marginTop:12, boxShadow:'var(--shadow-sm)'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700 }}>NFS-e — Resultado da análise</span>
        <span style={{ fontSize:11, background:'var(--bg-2)', padding:'3px 8px', borderRadius:20, fontFamily:'DM Mono, monospace', color:'var(--text-2)' }}>Nº {dados.cNF || '—'}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))', gap:12, padding:'12px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', marginBottom:4 }}>
        <Campo label="Valor serviço" value={fmtMoeda(dados.vServ)} />
        <Campo label="ISS" value={`${fmtMoeda(dados.vISS)} (${fmtNum(dados.pAliqISS)}%)`} />
        <Campo label="cIndOp" value={dados.cIndOp} mono />
        <Campo label="cTribNac" value={dados.cTribNac} mono />
        <Campo label="Local prestação" value={dados.cLocPrestacao} mono />
        <Campo label="PIS" value={dados.pPIS ? `${fmtNum(dados.pPIS)}% CST ${dados.CST_PIS}` : null} />
        <Campo label="COFINS" value={dados.pCOFINS ? `${fmtNum(dados.pCOFINS)}% CST ${dados.CST_COFINS}` : null} />
      </div>
      <CheckResult {...res} />
    </div>
  )
}

function PainelNFe({ dados, tipo, tipoLabel, parResult }) {
  const res = verificarNFe(dados, tipo)
  const temErros = res.erros.length > 0
  return (
    <div style={{
      background:'#fff', border:`1px solid ${temErros ? '#FCA5A5' : 'var(--border)'}`,
      borderLeft: `4px solid ${temErros ? 'var(--red)' : 'var(--green)'}`,
      borderRadius:10, padding:16, marginTop:12, boxShadow:'var(--shadow-sm)'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:700 }}>NF-e — {tipoLabel}</span>
        <div style={{ display:'flex', gap:6 }}>
          <span style={{ fontSize:11, background:'var(--bg-2)', padding:'3px 8px', borderRadius:20, fontFamily:'DM Mono, monospace', color:'var(--text-2)' }}>Nº {dados.nNF}</span>
          <span style={{ fontSize:11, background:'var(--bg-2)', padding:'3px 8px', borderRadius:20, fontFamily:'DM Mono, monospace', color:'var(--text-2)' }}>CFOP {dados.CFOP}</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))', gap:12, padding:'12px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', marginBottom:4 }}>
        <Campo label="Valor produtos" value={fmtMoeda(dados.vProd)} />
        <Campo label="ICMS" value={fmtMoeda(dados.vICMS)} />
        {dados.vICMSST > 0 && <Campo label="ICMS-ST" value={fmtMoeda(dados.vICMSST)} />}
        <Campo label="Total NF" value={fmtMoeda(dados.vNF)} />
        <Campo label="UF destino" value={dados.UF_dest} />
        <Campo label="Nat. operação" value={dados.natOp} />
      </div>
      <CheckResult {...res} />
      {parResult && (
        <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-2)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Par conserto (entrada ↔ saída)</div>
          <CheckResult {...parResult} />
        </div>
      )}
    </div>
  )
}

// ── Painel PDF espelho ────────────────────────────────────────────────────────
function PainelPdf({ dados }) {
  if (!dados) return null

  const avisoBar = (msg) => (
    <div style={{ display:'flex', gap:8, alignItems:'flex-start', marginTop:12, padding:'8px 12px', background:'var(--yellow-bg)', border:'1px solid #FDE68A', borderRadius:7 }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0, marginTop:1 }}>
        <path d="M7 1L13 12.5H1L7 1Z" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1"/>
        <path d="M7 5.5v3M7 10v.5" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize:11, color:'var(--yellow-text)', lineHeight:1.5 }}>{msg}</span>
    </div>
  )

  const gridFields = (pairs) => (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:12, padding:'12px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', margin:'8px 0 4px' }}>
      {pairs.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} style={{ display:'flex', flexDirection:'column', gap:2 }}>
          <span style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{k}</span>
          <span style={{ fontSize:12, fontWeight:500, color:'var(--text)', fontFamily:'DM Mono, monospace' }}>{v}</span>
        </div>
      ))}
    </div>
  )

  if (dados.tipo === 'pdf_nfse') {
    return (
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderLeft:'4px solid #F59E0B', borderRadius:10, padding:16, marginTop:12, boxShadow:'var(--shadow-sm)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:13, fontWeight:700 }}>Espelho NFS-e (PDF)</span>
          <span style={{ fontSize:11, background:'var(--bg-2)', padding:'3px 8px', borderRadius:20, fontFamily:'DM Mono, monospace', color:'var(--text-2)' }}>Nº {dados.numero}</span>
        </div>
        {gridFields([
          ['Valor serviço', dados.valorServico],
          ['ISS', dados.iss + (dados.aliqISS ? ` (${dados.aliqISS}%)` : '')],
          ['cIndOp', dados.cIndOp],
          ['cTribNac', dados.cTribNac],
          ['Local prestação', dados.locPrestacao],
          ['PIS/COFINS', dados.pisCofins],
        ])}
        {avisoBar('Conferência manual: o XML ainda não está disponível. Use este espelho para pré-conferir os campos antes da emissão.')}
      </div>
    )
  }

  if (dados.tipo === 'pdf_nfe') {
    const temTransp = dados.transp || dados.cnpjTransp || dados.pesoBruto || dados.volumes
    return (
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderLeft:'4px solid #F59E0B', borderRadius:10, padding:16, marginTop:12, boxShadow:'var(--shadow-sm)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
          <span style={{ fontSize:13, fontWeight:700 }}>Espelho NF-e (PDF)</span>
          <div style={{ display:'flex', gap:6 }}>
            <span style={{ fontSize:11, background:'var(--bg-2)', padding:'3px 8px', borderRadius:20, fontFamily:'DM Mono, monospace', color:'var(--text-2)' }}>Nº {dados.numero}</span>
            {dados.serie && <span style={{ fontSize:11, background:'var(--bg-2)', padding:'3px 8px', borderRadius:20, fontFamily:'DM Mono, monospace', color:'var(--text-2)' }}>Série {dados.serie}</span>}
          </div>
        </div>

        {/* Identificação */}
        <div style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', margin:'10px 0 4px' }}>Identificação</div>
        {gridFields([
          ['Nat. operação', dados.natOp],
          ['CFOP', dados.cfop],
          ['UF destino', dados.ufDest],
        ])}

        {/* Produto */}
        <div style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', margin:'10px 0 4px' }}>Produto / Tributação</div>
        {gridFields([
          ['NCM', dados.ncm],
          ['CEST', dados.cest],
          ['Valor produtos', dados.valorProd],
          ['ICMS', dados.valorICMS],
          ['ICMS-ST', dados.valorICMSST],
          ['Total NF', dados.valorTotal],
        ])}

        {/* Partes */}
        {(dados.cnpjEmit || dados.cnpjDest) && <>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', margin:'10px 0 4px' }}>Emitente / Destinatário</div>
          {gridFields([
            ['CNPJ emitente', dados.cnpjEmit],
            ['CNPJ destinatário', dados.cnpjDest],
          ])}
        </>}

        {/* Transporte */}
        {temTransp && <>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', margin:'10px 0 4px' }}>Transporte</div>
          {gridFields([
            ['Transportadora', dados.transp],
            ['CNPJ transp.', dados.cnpjTransp],
            ['Peso bruto', dados.pesoBruto ? `${dados.pesoBruto} kg` : null],
            ['Volumes', dados.volumes],
            ['Espécie', dados.especie],
          ])}
        </>}

        {/* Chave de acesso */}
        {dados.chave && <div style={{ marginTop:8, padding:'8px 10px', background:'var(--bg-2)', borderRadius:6 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>Chave de acesso</div>
          <div style={{ fontSize:11, fontFamily:'DM Mono, monospace', color:'var(--text-2)', wordBreak:'break-all' }}>{dados.chave}</div>
        </div>}

        {avisoBar('Espelho extraído do PDF — confira os valores campo a campo antes de transmitir.')}
      </div>
    )
  }

  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:16, marginTop:12 }}>
      <div style={{ fontSize:12, fontWeight:600, marginBottom:8 }}>PDF carregado — {dados.fonte}</div>
      <div style={{ fontSize:11, color:'var(--text-2)', marginBottom:8 }}>Não foi possível identificar o tipo de nota automaticamente. Texto extraído:</div>
      <div style={{ padding:10, background:'var(--bg-3)', borderRadius:6, fontSize:10, fontFamily:'DM Mono, monospace', whiteSpace:'pre-wrap', maxHeight:180, overflow:'auto' }}>
        {dados.texto}
      </div>
    </div>
  )
}

// ── Checklist ─────────────────────────────────────────────────────────────────
const checklistNFSe = [
  'CNPJ prestador = Gera Vale (19.090.416/0001-76)',
  'cTribNac = 140101 (manutenção) ou 100901 (comissão Kaeser)',
  'cTribMun = 0068',
  'cIndOp correto para o caso (050101 oficina / 050102 cliente / 050104 outro endereço / 100301 comissão)',
  'Local de prestação = SJC (3549904)',
  'ISS 3%',
  'PIS 0,65% / COFINS 3% — CST 01',
  'Retenção PIS/COFINS 4,65% se tomador PJ fora do Simples e nota ≥ R$ 215,06 (tpRetPisCofins = 3)',
  'IBS/CBS CST 000 / cClassTrib 000001 / CBS 0,9% / IBS 0,1% (se destacado)',
]
const checklistNFeOleo = [
  'CFOP 5405 (SP) ou 6403 (interestadual)',
  'NCM 3403.99.00',
  'CEST 06.017.00',
  'Origem 2 (estrangeiro procedência conhecida)',
  'ICMS 4% (interestadual)',
  'PE: ICMS-ST 20,5% fórmula específica — digitar manualmente',
  'ES: ICMS-ST 17% fórmula genérica — Omie calcula',
  'SP: CST 60, sem ICMS-ST novo (ST recolhida na entrada)',
  'Base PIS/COFINS = vProd − ICMS próprio',
  'PIS 1,65% / COFINS 7,6% — CST 01',
  'IBS/CBS CST 000 / cClassTrib 000001 / CBS 0,9% / IBS 0,1%',
  'GNRE para PE/ES após autorizar nota',
]
const checklistNFeConserto = [
  'NF entrada (5915 SP / 6915 outro estado) recebida e registrada no Omie',
  'Produto associado ao SCRKR — nunca cadastrar novo produto',
  'Local de estoque E.MOV, categoria "Mercadoria recebida para conserto"',
  'Local de Estoque de Saída em branco (campo deve estar vazio)',
  'NF retorno (5916 SP / 6916 outro estado) gerada a partir da nota de entrada',
  'Itens e valores iguais na entrada e no retorno',
  'NCM no retorno igual ao NCM da nota de entrada',
  'CNPJ destinatário no retorno = CNPJ remetente da entrada',
  'Sem conta a pagar / sem conta a receber',
]
const checklistNFePecas = [
  'CFOP 6102 (venda interestadual) — verificar se destino é fora de SP',
  'NCM 8421.99.10 ou 8421.99.99 (filtros/separadores Kaeser)',
  'Origem 2 (estrangeiro, procedência conhecida) — CST ICMS 200',
  'ICMS 4% (interestadual com produto de origem estrangeira)',
  'Sem ICMS-ST (filtros NCM 8421 não têm ST)',
  'IPI 0% — confirmar no XML se campo está zerado',
  'Nat. Operação: "Venda de Mercadoria Adquirida/Recebida de Terceiros"',
  'Pedido Kaeser referenciado nas informações complementares',
  'GNRE não necessária (sem ST)',
]
const checklistNFeOleoRemessa = [
  'Contexto: cliente retirou quantidade parcial — esta nota cobre a entrega do saldo restante',
  'CFOP 6117 — remessa por conta e ordem para entrega futura (interestadual)',
  'NCM 3403.99.00 (óleo lubrificante Kaeser ANS460)',
  'Nat. Operação: "Venda Merc.Adq/Rec.de Terceiros, Orig.de Encom.p/Entrega Fut"',
  'CST ICMS 041 — monofásico, não incidência (art. 7º, XIV, RICMS SP)',
  'ICMS = R$ 0,00 — imposto já foi recolhido integralmente na NF de origem',
  'Inf. Complementares: mencionar art. 7º, XIV do RICMS/SP (Decreto nº 45.490/2000)',
  'NF de origem referenciada no XML (NFref) — série 1, número da nota original',
  'Quantidade desta remessa + já retirada = total faturado na nota de origem',
  'Sem ICMS-ST, sem IPI',
  'GNRE não necessária',
]

function Checklist({ items, title, accentColor = 'var(--blue)' }) {
  const [checked, setChecked] = useState({})
  const toggle = i => setChecked(c => ({ ...c, [i]: !c[i] }))
  const nChecked = items.filter((_, i) => checked[i]).length
  const todos = nChecked === items.length
  const pct = Math.round((nChecked / items.length) * 100)
  return (
    <div style={{
      background:'#fff', border:`1px solid ${todos ? 'var(--green)' : 'var(--border)'}`,
      borderLeft: `4px solid ${todos ? 'var(--green)' : accentColor}`,
      borderRadius:10, padding:0, overflow:'hidden', boxShadow:'var(--shadow-sm)'
    }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)', background: todos ? 'var(--green-bg)' : 'var(--bg-2)' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{title}</span>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {todos ? (
            <span style={{ fontSize:11, color:'var(--green-text)', fontWeight:600 }}>✓ Concluído</span>
          ) : (
            <span style={{ fontSize:11, color:'var(--text-3)' }}>{nChecked} / {items.length}</span>
          )}
          {/* mini progress */}
          <div style={{ width:60, height:5, background:'var(--bg-3)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background: todos ? 'var(--green)' : accentColor, borderRadius:10, transition:'width .3s' }} />
          </div>
        </div>
      </div>
      {/* Items */}
      <div style={{ padding:'4px 0' }}>
        {items.map((item, i) => (
          <label key={i} onClick={() => toggle(i)} style={{
            display:'flex', gap:12, alignItems:'flex-start',
            padding:'9px 16px', cursor:'pointer',
            borderBottom: i < items.length-1 ? '1px solid var(--bg-3)' : 'none',
            background: checked[i] ? 'var(--bg-2)' : '#fff',
            transition:'background .12s',
          }}>
            {/* Custom checkbox */}
            <div style={{
              width:17, height:17, flexShrink:0, marginTop:1, borderRadius:4,
              border: checked[i] ? 'none' : '2px solid var(--border-2)',
              background: checked[i] ? accentColor : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background .15s, border .15s',
            }}>
              {checked[i] && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{
              fontSize:13, lineHeight:1.5,
              color: checked[i] ? 'var(--text-3)' : 'var(--text)',
              textDecoration: checked[i] ? 'line-through' : 'none',
              transition:'color .15s',
            }}>
              {item}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Conferidor() {
  const [tab, setTab] = useState('verificacao')

  // NFS-e
  const [nfseData, setNfseData] = useState(null)
  const [nfsePdf, setNfsePdf] = useState(null)
  const [nfseFileName, setNfseFileName] = useState('')
  const [nfseError, setNfseError] = useState('')

  // NF-e Óleo
  const [nfeOleoData, setNfeOleoData] = useState(null)
  const [nfeOleoPdf, setNfeOleoPdf] = useState(null)
  const [nfeOleoFileName, setNfeOleoFileName] = useState('')
  const [nfeOleoError, setNfeOleoError] = useState('')

  // NF-e Conserto
  const [nfeEntData, setNfeEntData] = useState(null)
  const [nfeEntFileName, setNfeEntFileName] = useState('')
  const [nfeEntError, setNfeEntError] = useState('')
  const [nfeSaiData, setNfeSaiData] = useState(null)
  const [nfeSaiFileName, setNfeSaiFileName] = useState('')
  const [nfeSaiError, setNfeSaiError] = useState('')

  // NF-e Peças/Filtros
  const [nfePecasData, setNfePecasData] = useState(null)
  const [nfePecasPdf, setNfePecasPdf] = useState(null)
  const [nfePecasFileName, setNfePecasFileName] = useState('')
  const [nfePecasError, setNfePecasError] = useState('')

  // NF-e Óleo Remessa Futura
  const [nfeOleoRemData, setNfeOleoRemData] = useState(null)
  const [nfeOleoRemPdf, setNfeOleoRemPdf] = useState(null)
  const [nfeOleoRemFileName, setNfeOleoRemFileName] = useState('')
  const [nfeOleoRemError, setNfeOleoRemError] = useState('')

  function tryParseNFSe(xml, name) {
    try { setNfseData(parseNFSe(xml)); setNfsePdf(null); setNfseFileName(name); setNfseError('') }
    catch (e) { setNfseError(e.message); setNfseData(null); setNfsePdf(null) }
  }
  function tryPdfNFSe(text, name, err) {
    setNfseData(null); setNfseFileName(name)
    if (err) { setNfseError('Erro ao ler PDF: ' + err); setNfsePdf(null) }
    else { setNfsePdf(parsePdfEspelho(text, name)); setNfseError('') }
  }
  function tryParseNFeOleo(xml, name) {
    try { setNfeOleoData(parseNFe(xml)); setNfeOleoPdf(null); setNfeOleoFileName(name); setNfeOleoError('') }
    catch (e) { setNfeOleoError(e.message); setNfeOleoData(null); setNfeOleoPdf(null) }
  }
  function tryPdfNFeOleo(text, name, err) {
    setNfeOleoData(null); setNfeOleoFileName(name)
    if (err) { setNfeOleoError('Erro ao ler PDF: ' + err); setNfeOleoPdf(null) }
    else { setNfeOleoPdf(parsePdfEspelho(text, name)); setNfeOleoError('') }
  }
  function tryParseEnt(xml, name) {
    try { setNfeEntData(parseNFe(xml)); setNfeEntFileName(name); setNfeEntError('') }
    catch (e) { setNfeEntError(e.message); setNfeEntData(null) }
  }
  function tryParseSai(xml, name) {
    try { setNfeSaiData(parseNFe(xml)); setNfeSaiFileName(name); setNfeSaiError('') }
    catch (e) { setNfeSaiError(e.message); setNfeSaiData(null) }
  }
  function tryParseNFePecas(xml, name) {
    try { setNfePecasData(parseNFe(xml)); setNfePecasPdf(null); setNfePecasFileName(name); setNfePecasError('') }
    catch (e) { setNfePecasError(e.message); setNfePecasData(null); setNfePecasPdf(null) }
  }
  function tryPdfNFePecas(text, name, err) {
    setNfePecasData(null); setNfePecasFileName(name)
    if (err) { setNfePecasError('Erro ao ler PDF: ' + err); setNfePecasPdf(null) }
    else { setNfePecasPdf(parsePdfEspelho(text, name)); setNfePecasError('') }
  }
  function tryParseNFeOleoRem(xml, name) {
    try { setNfeOleoRemData(parseNFe(xml)); setNfeOleoRemPdf(null); setNfeOleoRemFileName(name); setNfeOleoRemError('') }
    catch (e) { setNfeOleoRemError(e.message); setNfeOleoRemData(null); setNfeOleoRemPdf(null) }
  }
  function tryPdfNFeOleoRem(text, name, err) {
    setNfeOleoRemData(null); setNfeOleoRemFileName(name)
    if (err) { setNfeOleoRemError('Erro ao ler PDF: ' + err); setNfeOleoRemPdf(null) }
    else { setNfeOleoRemPdf(parsePdfEspelho(text, name)); setNfeOleoRemError('') }
  }

  const parConserto = (nfeEntData && nfeSaiData) ? verificarParConserto(nfeEntData, nfeSaiData) : null

  const tabStyle = active => ({
    padding:'7px 18px', borderRadius:7, fontSize:13, fontWeight: active ? 600 : 400,
    cursor:'pointer', background: active ? '#fff' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text-2)', border:'none',
    boxShadow: active ? 'var(--shadow-sm)' : 'none',
    transition:'all .15s'
  })

  // Componente de seção — label+cor padronizados
  const Secao = ({ cor, icone, titulo, subtitulo, children }) => (
    <section>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:`color-mix(in srgb, ${cor} 12%, white)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
          {icone}
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{titulo}</div>
          {subtitulo && <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{subtitulo}</div>}
        </div>
      </div>
      {children}
    </section>
  )

  const ErroBanner = ({ msg }) => msg ? (
    <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:8, padding:'8px 12px', background:'var(--red-bg)', border:'1px solid #FCA5A5', borderRadius:7 }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0 }}>
        <circle cx="7" cy="7" r="7" fill="#FCA5A5"/>
        <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize:12, color:'var(--red-text)' }}>{msg}</span>
    </div>
  ) : null

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-2)' }}>
      <Nav />
      <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>

        {/* Header da página */}
        <div style={{ marginBottom:28, paddingBottom:24, borderBottom:'1px solid var(--border)' }}>
          <h1 style={{ fontSize:22, fontWeight:700, color:'var(--text)' }}>Conferidor de Notas</h1>
          <p style={{ fontSize:13, color:'var(--text-2)', marginTop:4 }}>
            Carregue o XML ou o espelho em PDF para conferência automática dos campos fiscais
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:2, marginBottom:28, background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:10, padding:4, width:'fit-content' }}>
          <button style={tabStyle(tab==='verificacao')} onClick={() => setTab('verificacao')}>
            Verificação automática
          </button>
          <button style={tabStyle(tab==='checklist')} onClick={() => setTab('checklist')}>
            Checklist manual
          </button>
        </div>

        {tab === 'verificacao' && (
          <div style={{ display:'flex', flexDirection:'column', gap:32 }}>

            {/* NFS-e */}
            <Secao cor="var(--blue)" icone="📋" titulo="NFS-e — Serviço" subtitulo="Manutenção ou comissão Kaeser · cTribNac 140101 ou 100901">
              <DropZone label="Carregar NFS-e" onFile={tryParseNFSe} onPdf={tryPdfNFSe} fileName={nfseFileName} color="var(--blue)" />
              <ErroBanner msg={nfseError} />
              {nfseData && <PainelNFSe dados={nfseData} />}
              {nfsePdf && <PainelPdf dados={nfsePdf} />}
            </Secao>

            <div style={{ borderTop:'1px solid var(--border)' }} />

            {/* NF-e Óleo faturamento normal */}
            <Secao cor="var(--orange)" icone="🛢" titulo="NF-e — Óleo / Lubrificante" subtitulo="Venda com ST · CFOP 5405 (SP) ou 6403 (interestadual) · NCM 3403.99.00">
              <DropZone label="Carregar NF-e de óleo" onFile={tryParseNFeOleo} onPdf={tryPdfNFeOleo} fileName={nfeOleoFileName} color="var(--orange)" />
              <ErroBanner msg={nfeOleoError} />
              {nfeOleoData && <PainelNFe dados={nfeOleoData} tipo="oleo" tipoLabel="Óleo / Lubrificante" />}
              {nfeOleoPdf && <PainelPdf dados={nfeOleoPdf} />}
            </Secao>

            <div style={{ borderTop:'1px solid var(--border)' }} />

            {/* NF-e Óleo Remessa Futura */}
            <Secao cor="#0D9488" icone="🔄" titulo="NF-e — Óleo Remessa Futura" subtitulo="Entrega parcial pendente · CFOP 6117 · CST 041 · ICMS = 0">
              <DropZone label="Carregar NF-e de óleo (remessa futura)" onFile={tryParseNFeOleoRem} onPdf={tryPdfNFeOleoRem} fileName={nfeOleoRemFileName} color="#0D9488" />
              <ErroBanner msg={nfeOleoRemError} />
              {nfeOleoRemData && <PainelNFe dados={nfeOleoRemData} tipo="oleo_remessa" tipoLabel="Óleo Remessa Futura" />}
              {nfeOleoRemPdf && <PainelPdf dados={nfeOleoRemPdf} />}
            </Secao>

            <div style={{ borderTop:'1px solid var(--border)' }} />

            {/* NF-e Peças / Filtros */}
            <Secao cor="#7C3AED" icone="🔧" titulo="NF-e — Peças / Filtros Kaeser" subtitulo="Venda interestadual · CFOP 6102 · NCM 8421 · CST 200 · ICMS 4%">
              <DropZone label="Carregar NF-e de peças/filtros" onFile={tryParseNFePecas} onPdf={tryPdfNFePecas} fileName={nfePecasFileName} color="#7C3AED" />
              <ErroBanner msg={nfePecasError} />
              {nfePecasData && <PainelNFe dados={nfePecasData} tipo="pecas" tipoLabel="Peças / Filtros" />}
              {nfePecasPdf && <PainelPdf dados={nfePecasPdf} />}
            </Secao>

            <div style={{ borderTop:'1px solid var(--border)' }} />

            {/* NF-e Conserto */}
            <Secao cor="var(--gv-yellow)" icone="⚙" titulo="NF-e — Conserto" subtitulo="Par de notas entrada (5915/6915) + retorno (5916/6916)">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:4 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text-2)', marginBottom:6 }}>① Remessa para conserto</div>
                  <DropZone label="XML de remessa (5915/6915)" onFile={tryParseEnt} fileName={nfeEntFileName} color="var(--gv-yellow-dk)" accept=".xml" />
                  <ErroBanner msg={nfeEntError} />
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text-2)', marginBottom:6 }}>② Retorno do conserto</div>
                  <DropZone label="XML de retorno (5916/6916)" onFile={tryParseSai} fileName={nfeSaiFileName} color="var(--gv-yellow-dk)" accept=".xml" />
                  <ErroBanner msg={nfeSaiError} />
                </div>
              </div>
              {nfeEntData && <PainelNFe dados={nfeEntData} tipo="conserto_entrada" tipoLabel="Remessa para conserto" parResult={parConserto} />}
              {nfeSaiData && <PainelNFe dados={nfeSaiData} tipo="conserto_saida" tipoLabel="Retorno do conserto" />}
            </Secao>

          </div>
        )}

        {tab === 'checklist' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Checklist title="NFS-e — Serviço" accentColor="var(--blue)" items={checklistNFSe} />
            <Checklist title="NF-e — Óleo / Lubrificante" accentColor="var(--orange)" items={checklistNFeOleo} />
            <Checklist title="NF-e — Óleo Remessa Futura" accentColor="#0D9488" items={checklistNFeOleoRemessa} />
            <Checklist title="NF-e — Peças / Filtros Kaeser" accentColor="#7C3AED" items={checklistNFePecas} />
            <Checklist title="NF-e — Conserto" accentColor="var(--gv-yellow-dk)" items={checklistNFeConserto} />
          </div>
        )}
      </div>
    </div>
  )
}
