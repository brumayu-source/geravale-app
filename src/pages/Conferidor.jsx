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
    return {
      tipo: 'pdf_nfe',
      fonte: nome,
      numero: get(/(?:N[úu]mero|N[°º]\.?|NF-e\s+n[°º]?)[^0-9]*([0-9]+)/i),
      serie: get(/S[eé]rie[^0-9]*([0-9]+)/i),
      chave: get(/Chave\s+de\s+acesso[^0-9]*([0-9\s]{44,})/i, '').replace(/\s/g, ''),
      cfop: get(/CFOP[^0-9]*([0-9]\.[0-9]{3})/i),
      ncm: getAll(/NCM[^0-9]*([0-9]{4}\.?[0-9]{2}\.?[0-9]{2})/gi)[0] || '',
      cest: get(/CEST[^0-9]*([0-9]{2}\.?[0-9]{3}\.?[0-9]{2})/i),
      valorProd: get(/(?:Valor\s+Total\s+Produtos|vProd)[^R$0-9]*(?:R?\$\s*)?([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})/i),
      valorICMS: get(/(?:Valor\s+ICMS\b|vICMS)[^R$0-9]*(?:R?\$\s*)?([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})/i),
      valorICMSST: get(/(?:ICMS.ST|Substitui[çc][ãa]o)[^R$0-9]*(?:R?\$\s*)?([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})/i),
      valorTotal: get(/(?:Valor\s+Total\s+NF|Total\s+da\s+Nota)[^R$0-9]*(?:R?\$\s*)?([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})/i),
      ufDest: get(/(?:UF\s+Dest[^a-z]|Estado\s+Dest)[^A-Z]*([A-Z]{2})/i),
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
  return (
    <div style={{ marginTop: 14 }}>
      {ok.map((m, i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'5px 10px', marginBottom:3, background:'var(--green-bg)', borderRadius:6 }}>
          <span style={{ color:'var(--green)', fontSize:13, marginTop:1 }}>✓</span>
          <span style={{ fontSize:12, color:'var(--green-text)' }}>{m}</span>
        </div>
      ))}
      {avisos.map((m, i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'5px 10px', marginBottom:3, background:'var(--yellow-bg)', borderRadius:6 }}>
          <span style={{ color:'#FFA657', fontSize:13, marginTop:1 }}>⚠</span>
          <span style={{ fontSize:12, color:'var(--yellow-text)' }}>{m}</span>
        </div>
      ))}
      {erros.map((m, i) => (
        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'5px 10px', marginBottom:3, background:'var(--red-bg)', borderRadius:6 }}>
          <span style={{ color:'var(--red)', fontSize:13, marginTop:1 }}>✕</span>
          <span style={{ fontSize:12, color:'var(--red-text)' }}>{m}</span>
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

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={() => ref.current.click()}
      style={{
        border:`2px dashed ${over ? color : 'var(--border-2)'}`,
        borderRadius:10, padding:'18px 16px', textAlign:'center',
        cursor:'pointer', transition:'border-color .2s, background .2s',
        background: over ? 'var(--bg-3)' : 'var(--bg-2)',
        minHeight:90, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6
      }}
    >
      <input type="file" accept={accept} ref={ref} style={{ display:'none' }}
        onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]) }} />
      {loading
        ? <><span style={{ fontSize:20 }}>⏳</span><div style={{ fontSize:11, color:'var(--text-2)' }}>Lendo PDF…</div></>
        : <>
          <span style={{ fontSize:22 }}>{aceitaPdf ? '📄' : '📋'}</span>
          <div style={{ fontSize:12, color:'var(--text-2)' }}>{label}</div>
          {aceitaPdf && <div style={{ fontSize:10, color:'var(--text-3)' }}>XML ou PDF (espelho)</div>}
          {fileName && <div style={{ fontSize:11, color, fontFamily:'DM Mono, monospace' }}>{fileName}</div>}
        </>
      }
    </div>
  )
}

// ── Painéis de conferência ────────────────────────────────────────────────────
function PainelNFSe({ dados }) {
  const res = verificarNFSe(dados)
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginTop:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:12, fontWeight:600 }}>NFS-e</span>
        <span style={{ fontSize:11, color:'var(--text-2)', fontFamily:'DM Mono, monospace' }}>Nº {dados.cNF}</span>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:16, fontSize:11, color:'var(--text-2)', marginBottom:8 }}>
        <span>Valor: <strong style={{ color:'var(--text)' }}>{fmtMoeda(dados.vServ)}</strong></span>
        <span>ISS: <strong style={{ color:'var(--text)' }}>{fmtMoeda(dados.vISS)} ({fmtNum(dados.pAliqISS)}%)</strong></span>
        <span>cIndOp: <strong style={{ color:'var(--text)' }}>{dados.cIndOp}</strong></span>
      </div>
      <CheckResult {...res} />
    </div>
  )
}

function PainelNFe({ dados, tipo, tipoLabel, parResult }) {
  const res = verificarNFe(dados, tipo)
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginTop:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:12, fontWeight:600 }}>NF-e — {tipoLabel}</span>
        <span style={{ fontSize:11, color:'var(--text-2)', fontFamily:'DM Mono, monospace' }}>Nº {dados.nNF} · {dados.CFOP}</span>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:16, fontSize:11, color:'var(--text-2)', marginBottom:8 }}>
        <span>vProd: <strong style={{ color:'var(--text)' }}>{fmtMoeda(dados.vProd)}</strong></span>
        <span>ICMS: <strong style={{ color:'var(--text)' }}>{fmtMoeda(dados.vICMS)}</strong></span>
        {dados.vICMSST > 0 && <span>ICMS-ST: <strong style={{ color:'var(--text)' }}>{fmtMoeda(dados.vICMSST)}</strong></span>}
        <span>UF dest: <strong style={{ color:'var(--text)' }}>{dados.UF_dest}</strong></span>
      </div>
      <CheckResult {...res} />
      {parResult && (
        <>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', margin:'12px 0 4px', textTransform:'uppercase', letterSpacing:'.06em' }}>Par conserto (entrada ↔ saída)</div>
          <CheckResult {...parResult} />
        </>
      )}
    </div>
  )
}

// ── Painel PDF espelho ────────────────────────────────────────────────────────
function PainelPdf({ dados }) {
  if (!dados) return null

  if (dados.tipo === 'pdf_nfse') {
    return (
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:600 }}>Espelho NFS-e (PDF)</span>
          <span style={{ fontSize:11, color:'var(--text-2)', fontFamily:'DM Mono, monospace' }}>Nº {dados.numero}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11 }}>
          {[
            ['Valor serviço', dados.valorServico],
            ['ISS', dados.iss + (dados.aliqISS ? ` (${dados.aliqISS}%)` : '')],
            ['cIndOp', dados.cIndOp],
            ['cTribNac', dados.cTribNac],
            ['Local prestação', dados.locPrestacao],
            ['PIS/COFINS', dados.pisCofins],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ display:'flex', gap:8 }}>
              <span style={{ color:'var(--text-2)', minWidth:120 }}>{k}</span>
              <span style={{ fontFamily:'DM Mono, monospace', color:'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:12, padding:10, background:'var(--bg-3)', borderRadius:6, fontSize:10, color:'var(--text-2)', fontFamily:'DM Mono, monospace', whiteSpace:'pre-wrap', maxHeight:120, overflow:'auto' }}>
          {dados.texto.substring(0, 500)}…
        </div>
        <div style={{ marginTop:8, fontSize:11, color:'#FFA657' }}>⚠ Conferência manual: o XML ainda não está disponível. Use este espelho para pré-conferir os campos principais antes da emissão.</div>
      </div>
    )
  }

  if (dados.tipo === 'pdf_nfe') {
    return (
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:600 }}>Espelho NF-e (PDF)</span>
          <span style={{ fontSize:11, color:'var(--text-2)', fontFamily:'DM Mono, monospace' }}>Nº {dados.numero} · Série {dados.serie}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11 }}>
          {[
            ['CFOP', dados.cfop],
            ['NCM', dados.ncm],
            ['CEST', dados.cest],
            ['Valor produtos', dados.valorProd],
            ['ICMS', dados.valorICMS],
            ['ICMS-ST', dados.valorICMSST],
            ['Total NF', dados.valorTotal],
            ['UF destino', dados.ufDest],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ display:'flex', gap:8 }}>
              <span style={{ color:'var(--text-2)', minWidth:120 }}>{k}</span>
              <span style={{ fontFamily:'DM Mono, monospace', color:'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8, fontSize:11, color:'#FFA657' }}>⚠ Espelho do PDF extraído automaticamente. Confira os valores campo a campo antes de transmitir.</div>
      </div>
    )
  }

  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginTop:12 }}>
      <div style={{ fontSize:12, fontWeight:600, marginBottom:8 }}>PDF carregado — {dados.fonte}</div>
      <div style={{ fontSize:11, color:'var(--text-2)', marginBottom:8 }}>Não foi possível identificar o tipo de nota. Texto extraído:</div>
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

function Checklist({ items, title }) {
  const [checked, setChecked] = useState({})
  const toggle = i => setChecked(c => ({ ...c, [i]: !c[i] }))
  const todos = items.every((_, i) => checked[i])
  return (
    <div style={{ background:'var(--bg-2)', border:`1px solid ${todos ? 'var(--green)' : 'var(--border)'}`, borderRadius:10, padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <span style={{ fontSize:10, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-2)' }}>{title}</span>
        {todos && <span style={{ fontSize:11, color:'var(--green-text)', background:'var(--green-bg)', padding:'1px 8px', borderRadius:20 }}>✓ Tudo certo</span>}
      </div>
      {items.map((item, i) => (
        <label key={i} style={{ display:'flex', gap:8, alignItems:'center', padding:'5px 0', cursor:'pointer', borderBottom: i < items.length-1 ? '1px solid var(--border)' : 'none' }}>
          <input type="checkbox" checked={!!checked[i]} onChange={() => toggle(i)}
            style={{ width:15, height:15, accentColor:'var(--blue)', flexShrink:0 }} />
          <span style={{ fontSize:12, color: checked[i] ? 'var(--text-3)' : 'var(--text)', textDecoration: checked[i] ? 'line-through' : 'none', transition:'color .15s' }}>
            {item}
          </span>
        </label>
      ))}
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

  const parConserto = (nfeEntData && nfeSaiData) ? verificarParConserto(nfeEntData, nfeSaiData) : null

  const tabStyle = active => ({
    padding:'6px 16px', borderRadius:6, fontSize:12, fontWeight: active ? 600 : 400,
    cursor:'pointer', background: active ? 'var(--bg-3)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text-2)', border:'none',
    transition:'background .15s, color .15s'
  })

  return (
    <div style={{ minHeight:'100vh' }}>
      <Nav crumbs={[{ label:'Conferidor de Notas' }]} />
      <div style={{ maxWidth:860, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:20, fontWeight:600 }}>Conferidor de Notas</h1>
          <p style={{ fontSize:12, color:'var(--text-2)', marginTop:3 }}>
            Arraste XML ou PDF (espelho) para conferência automática dos campos fiscais
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:8, padding:4, width:'fit-content' }}>
          <button style={tabStyle(tab==='verificacao')} onClick={() => setTab('verificacao')}>Verificação automática</button>
          <button style={tabStyle(tab==='checklist')} onClick={() => setTab('checklist')}>Checklist manual</button>
        </div>

        {tab === 'verificacao' && (
          <div style={{ display:'flex', flexDirection:'column', gap:28 }}>

            {/* NFS-e */}
            <section>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-2)', marginBottom:10 }}>NFS-e — Serviço</div>
              <DropZone label="Arraste o XML ou PDF da NFS-e" onFile={tryParseNFSe} onPdf={tryPdfNFSe} fileName={nfseFileName} color="var(--blue)" />
              {nfseError && <div style={{ fontSize:11, color:'var(--red-text)', marginTop:6 }}>✕ {nfseError}</div>}
              {nfseData && <PainelNFSe dados={nfseData} />}
              {nfsePdf && <PainelPdf dados={nfsePdf} />}
            </section>

            {/* NF-e Óleo */}
            <section>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-2)', marginBottom:10 }}>NF-e — Óleo / Lubrificante</div>
              <DropZone label="Arraste o XML ou PDF da NF-e de óleo" onFile={tryParseNFeOleo} onPdf={tryPdfNFeOleo} fileName={nfeOleoFileName} color="var(--orange)" />
              {nfeOleoError && <div style={{ fontSize:11, color:'var(--red-text)', marginTop:6 }}>✕ {nfeOleoError}</div>}
              {nfeOleoData && <PainelNFe dados={nfeOleoData} tipo="oleo" tipoLabel="Óleo / Lubrificante" />}
              {nfeOleoPdf && <PainelPdf dados={nfeOleoPdf} />}
            </section>

            {/* NF-e Conserto */}
            <section>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--text-2)', marginBottom:10 }}>NF-e — Conserto (par entrada + retorno)</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--text-2)', marginBottom:6 }}>Remessa para conserto (5915/6915)</div>
                  <DropZone label="XML de remessa" onFile={tryParseEnt} fileName={nfeEntFileName} color="var(--yellow-text)" accept=".xml" />
                  {nfeEntError && <div style={{ fontSize:11, color:'var(--red-text)', marginTop:6 }}>✕ {nfeEntError}</div>}
                </div>
                <div>
                  <div style={{ fontSize:11, color:'var(--text-2)', marginBottom:6 }}>Retorno do conserto (5916/6916)</div>
                  <DropZone label="XML de retorno" onFile={tryParseSai} fileName={nfeSaiFileName} color="var(--yellow-text)" accept=".xml" />
                  {nfeSaiError && <div style={{ fontSize:11, color:'var(--red-text)', marginTop:6 }}>✕ {nfeSaiError}</div>}
                </div>
              </div>
              {nfeEntData && <PainelNFe dados={nfeEntData} tipo="conserto_entrada" tipoLabel="Remessa para conserto" parResult={parConserto} />}
              {nfeSaiData && <PainelNFe dados={nfeSaiData} tipo="conserto_saida" tipoLabel="Retorno do conserto" />}
            </section>

          </div>
        )}

        {tab === 'checklist' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Checklist title="NFS-e — Serviço" items={checklistNFSe} />
            <Checklist title="NF-e — Óleo / Lubrificante" items={checklistNFeOleo} />
            <Checklist title="NF-e — Conserto" items={checklistNFeConserto} />
          </div>
        )}
      </div>
    </div>
  )
}
