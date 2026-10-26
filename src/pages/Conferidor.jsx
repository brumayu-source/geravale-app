import React, { useState, useCallback, useRef } from 'react'
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

  const cnpjPrest = parseCNPJ(getTag(doc, 'CNPJ') || getTag(doc, 'cnpj') || '')

  // Dados de valor
  const vServ = parseFloat(getTag(infDPS, 'vServPrest') || getTag(infDPS, 'vServ') || '0')

  // Tributos
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
    // PIS/COFINS
    CST_PIS: getTag(doc, 'CSTPIS') || getTag(doc, 'cstPIS'),
    pPIS: parseFloat(getTag(doc, 'pPIS') || '0'),
    vPIS: parseFloat(getTag(doc, 'vPIS') || '0'),
    CST_COFINS: getTag(doc, 'CSTCOFINS') || getTag(doc, 'cstCOFINS'),
    pCOFINS: parseFloat(getTag(doc, 'pCOFINS') || '0'),
    vCOFINS: parseFloat(getTag(doc, 'vCOFINS') || '0'),
    tpRetPisCofins: getTag(doc, 'tpRetPisCofins'),
    // IBS/CBS (reforma tributária)
    vIBS: parseFloat(getTag(doc, 'vIBS') || '0'),
    vCBS: parseFloat(getTag(doc, 'vCBS') || '0'),
    CST_IBS: getTag(doc, 'CSTibs') || getTag(doc, 'cstIBS'),
    cClassTrib: getTag(doc, 'cClassTrib'),
    // Emitente/destinatário
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

  const CFOP = getTag(ide, 'CFOP') || (() => {
    const dets = getAllTags(doc, 'det')
    if (dets.length > 0) return getTag(dets[0], 'CFOP')
    return ''
  })()

  // Itens
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

  const UF_dest = getTag(dest, 'UF') || getTag(doc, 'UF')

  return {
    tipo: 'nfe',
    chave: infNFe.getAttribute('Id') || '',
    nNF: getTag(ide, 'nNF'),
    CFOP: getTag(dets[0]?.getElementsByTagName('prod')[0] || doc, 'CFOP') || CFOP,
    natOp: getTag(ide, 'natOp'),
    cnpjEmit: parseCNPJ(getTag(emit, 'CNPJ')),
    cnpjDest: parseCNPJ(getTag(dest, 'CNPJ')),
    UF_dest,
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

// ── Verificadores ─────────────────────────────────────────────────────────────
function verificarNFSe(n) {
  const erros = []
  const avisos = []
  const ok = []

  // cTribNac
  if (n.cTribNac === '140101') ok.push('cTribNac 140101 — Serviços de conservação e manutenção ✓')
  else if (n.cTribNac === '100901') ok.push('cTribNac 100901 — Óleo/lubrificante via serviço ✓')
  else erros.push(`cTribNac "${n.cTribNac}" inesperado — esperado 140101 ou 100901`)

  // cTribMun
  if (n.cTribMun === '0068' || n.cTribMun === '068') ok.push('cTribMun 0068 — Manutenção e conservação de máquinas ✓')
  else erros.push(`cTribMun "${n.cTribMun}" — esperado 0068`)

  // cNBS
  if (n.cNBS) ok.push(`cNBS ${n.cNBS} presente`)
  else avisos.push('cNBS ausente')

  // cIndOp
  const indOpsValidos = ['050101', '050102', '050103', '050104', '100301']
  if (indOpsValidos.includes(n.cIndOp)) ok.push(`cIndOp ${n.cIndOp} ✓`)
  else erros.push(`cIndOp "${n.cIndOp}" inválido — esperado: ${indOpsValidos.join(', ')}`)

  // cLocPrestacao vs SJC
  const locNorm = (n.cLocPrestacao || '').replace(/^0+/, '')
  const sjcNorm = SJC_IBGE.replace(/^0+/, '')
  if (locNorm === sjcNorm) ok.push('Local de prestação: São José dos Campos ✓')
  else avisos.push(`cLocPrestacao "${n.cLocPrestacao}" — verifique se é SJC (${SJC_IBGE})`)

  // ISS 3%
  if (n.pAliqISS === 3 || Math.abs(n.pAliqISS - 3) < 0.01) ok.push(`Alíquota ISS 3% ✓ (${fmtNum(n.pAliqISS)}%)`)
  else if (n.pAliqISS > 0) erros.push(`Alíquota ISS ${fmtNum(n.pAliqISS)}% — esperado 3%`)

  // tpRetISSQN
  if (n.tpRetISSQN === '1') ok.push('tpRetISSQN = 1 (retido pelo tomador) ✓')
  else if (n.tpRetISSQN) avisos.push(`tpRetISSQN = ${n.tpRetISSQN} — verifique retenção`)

  // PIS CST 01
  if (n.CST_PIS === '01') ok.push(`PIS CST 01 (tributado) ✓ — ${fmtNum(n.pPIS, 2)}%`)
  else if (n.CST_PIS) erros.push(`PIS CST "${n.CST_PIS}" — esperado 01`)

  // COFINS CST 01
  if (n.CST_COFINS === '01') ok.push(`COFINS CST 01 (tributado) ✓ — ${fmtNum(n.pCOFINS, 2)}%`)
  else if (n.CST_COFINS) erros.push(`COFINS CST "${n.CST_COFINS}" — esperado 01`)

  // Retenção PIS/COFINS 4,65%
  if (n.tpRetPisCofins === '3') {
    ok.push('tpRetPisCofins = 3 — retenção 4,65% ✓')
  } else if (n.tpRetPisCofins) {
    avisos.push(`tpRetPisCofins = ${n.tpRetPisCofins} — verifique retenção de PIS/COFINS`)
  }

  // IBS/CBS (reforma tributária — opcional por enquanto)
  if (n.vIBS > 0 || n.vCBS > 0) {
    if (n.CST_IBS === '000') ok.push(`IBS/CBS CST 000 ✓`)
    else erros.push(`IBS/CBS CST "${n.CST_IBS}" — esperado 000`)
    if (n.cClassTrib === '000001') ok.push('cClassTrib 000001 ✓')
    else erros.push(`cClassTrib "${n.cClassTrib}" — esperado 000001`)
  }

  return { erros, avisos, ok }
}

function verificarNFe(nfe, tipo) {
  const erros = []
  const avisos = []
  const ok = []

  // CFOPs esperados por tipo
  const cfopsOleo = ['5405', '6403']
  const cfopsConserto = ['5916', '6916', '5915', '6915']

  const cfopsVistos = [...new Set(nfe.itens.map(i => i.CFOP))]

  if (tipo === 'oleo') {
    const cfopOk = cfopsVistos.some(c => cfopsOleo.includes(c))
    if (cfopOk) ok.push(`CFOP ${cfopsVistos.join(', ')} — óleo/lubrificante ✓`)
    else erros.push(`CFOP ${cfopsVistos.join(', ')} — esperado 5405 (dentro SP) ou 6403 (interestadual)`)
  } else if (tipo === 'conserto_saida') {
    const cfopOk = cfopsVistos.some(c => ['5916', '6916'].includes(c))
    if (cfopOk) ok.push(`CFOP ${cfopsVistos.join(', ')} — retorno de conserto ✓`)
    else erros.push(`CFOP ${cfopsVistos.join(', ')} — esperado 5916 (dentro SP) ou 6916 (interestadual)`)
  } else if (tipo === 'conserto_entrada') {
    const cfopOk = cfopsVistos.some(c => ['5915', '6915'].includes(c))
    if (cfopOk) ok.push(`CFOP ${cfopsVistos.join(', ')} — remessa para conserto ✓`)
    else erros.push(`CFOP ${cfopsVistos.join(', ')} — esperado 5915 (dentro SP) ou 6915 (interestadual)`)
  }

  // Por item
  nfe.itens.forEach(item => {
    const prefix = `Item ${item.nItem} (${item.cProd})`

    if (tipo === 'oleo') {
      // NCM
      if (item.NCM === '34039900' || item.NCM === '3403.99.00') ok.push(`${prefix} NCM 3403.99.00 ✓`)
      else erros.push(`${prefix} NCM "${item.NCM}" — esperado 3403.99.00`)

      // CEST
      if (item.CEST === '0601700' || item.CEST === '06.017.00') ok.push(`${prefix} CEST 06.017.00 ✓`)
      else avisos.push(`${prefix} CEST "${item.CEST}" — verifique (esperado 06.017.00)`)

      // Origem 2 (estrangeiro de procedência conhecida)
      if (item.orig === '2') ok.push(`${prefix} Origem 2 ✓`)
      else erros.push(`${prefix} Origem "${item.orig}" — esperado 2 (estrangeiro procedência conhecida)`)

      // ICMS 4%
      if (Math.abs(item.pICMS - 4) < 0.01) ok.push(`${prefix} ICMS 4% ✓`)
      else if (item.pICMS > 0) erros.push(`${prefix} ICMS ${fmtNum(item.pICMS)}% — esperado 4%`)

      // ICMS-ST por UF destino
      const stEsperado = { PE: 20.5, ES: 17, SP: 18 }[nfe.UF_dest] || null
      if (stEsperado !== null) {
        if (Math.abs(item.pICMSST - stEsperado) < 0.1) ok.push(`${prefix} ICMS-ST ${fmtNum(item.pICMSST)}% para ${nfe.UF_dest} ✓`)
        else if (item.pICMSST > 0) erros.push(`${prefix} ICMS-ST ${fmtNum(item.pICMSST)}% para ${nfe.UF_dest} — esperado ${stEsperado}%`)
      }

      // Base PIS/COFINS = vProd - vICMS próprio
      const baseEsperada = item.vProd - item.vICMS
      const diffPIS = Math.abs(item.vBC_PIS - baseEsperada)
      const diffCOFINS = Math.abs(item.vBC_COFINS - baseEsperada)
      if (diffPIS < 0.02 && diffCOFINS < 0.02) {
        ok.push(`${prefix} Base PIS/COFINS = vProd − ICMS próprio ✓`)
      } else if (item.vBC_PIS > 0) {
        avisos.push(`${prefix} Base PIS/COFINS: calculado R$${fmtNum(baseEsperada)}, declarado R$${fmtNum(item.vBC_PIS)} — verifique dedução do ICMS`)
      }
    }
  })

  return { erros, avisos, ok }
}

// ── Verificação de par conserto (entrada + saída) ─────────────────────────────
function verificarParConserto(entrada, saida) {
  if (!entrada || !saida) return null
  const erros = []
  const avisos = []
  const ok = []

  // Comparar itens
  const itEnt = entrada.itens
  const itSai = saida.itens

  if (itEnt.length !== itSai.length) {
    avisos.push(`Número de itens diferente: entrada tem ${itEnt.length}, saída tem ${itSai.length}`)
  }

  itEnt.forEach(ie => {
    const is = itSai.find(x => x.cProd === ie.cProd)
    if (!is) {
      erros.push(`Item ${ie.cProd} (${ie.xProd}) presente na entrada mas não na saída`)
    } else {
      if (Math.abs(ie.vProd - is.vProd) > 0.01) {
        erros.push(`Item ${ie.cProd}: valor entrada R$${fmtNum(ie.vProd)} ≠ saída R$${fmtNum(is.vProd)}`)
      } else {
        ok.push(`Item ${ie.cProd} — valores entrada/saída conferem ✓`)
      }
    }
  })

  // CFOP par
  const cfopEntrada = [...new Set(itEnt.map(i => i.CFOP))]
  const cfopSaida = [...new Set(itSai.map(i => i.CFOP))]
  const parOk = cfopEntrada.some(c => ['5915','6915'].includes(c)) && cfopSaida.some(c => ['5916','6916'].includes(c))
  if (parOk) ok.push(`Par de CFOP conserto: ${cfopEntrada.join(',')} ↔ ${cfopSaida.join(',')} ✓`)
  else erros.push(`Par de CFOP inválido: ${cfopEntrada.join(',')} ↔ ${cfopSaida.join(',')} — esperado 5915/6915 (entrada) e 5916/6916 (retorno)`)

  return { erros, avisos, ok }
}

// ── Componente CheckResult ─────────────────────────────────────────────────────
function CheckResult({ erros, avisos, ok }) {
  const total = erros.length + avisos.length + ok.length
  if (total === 0) return null

  return (
    <div style={{ marginTop: 16 }}>
      {ok.length > 0 && ok.map((m, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 10px', marginBottom: 3, background: 'var(--green-bg)', borderRadius: 6 }}>
          <span style={{ color: 'var(--green)', fontSize: 13, marginTop: 1 }}>✓</span>
          <span style={{ fontSize: 12, color: 'var(--green-text)' }}>{m}</span>
        </div>
      ))}
      {avisos.map((m, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 10px', marginBottom: 3, background: 'var(--yellow-bg)', borderRadius: 6 }}>
          <span style={{ color: '#FFA657', fontSize: 13, marginTop: 1 }}>⚠</span>
          <span style={{ fontSize: 12, color: 'var(--yellow-text)' }}>{m}</span>
        </div>
      ))}
      {erros.map((m, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 10px', marginBottom: 3, background: 'var(--red-bg)', borderRadius: 6 }}>
          <span style={{ color: 'var(--red)', fontSize: 13, marginTop: 1 }}>✕</span>
          <span style={{ fontSize: 12, color: 'var(--red-text)' }}>{m}</span>
        </div>
      ))}
    </div>
  )
}

// ── DropZone ──────────────────────────────────────────────────────────────────
function DropZone({ label, onFile, fileName, color = 'var(--blue)' }) {
  const ref = useRef()
  const [over, setOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }
  function readFile(file) {
    const reader = new FileReader()
    reader.onload = e => onFile(e.target.result, file.name)
    reader.readAsText(file, 'UTF-8')
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={() => ref.current.click()}
      style={{
        border: `2px dashed ${over ? color : 'var(--border-2)'}`,
        borderRadius: 10, padding: '20px 16px', textAlign: 'center',
        cursor: 'pointer', transition: 'border-color .2s, background .2s',
        background: over ? 'var(--bg-3)' : 'var(--bg-2)',
        minHeight: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6
      }}
    >
      <input type="file" accept=".xml" ref={ref} style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) readFile(e.target.files[0]) }} />
      <span style={{ fontSize: 24 }}>📄</span>
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</div>
      {fileName && <div style={{ fontSize: 11, color, fontFamily: 'DM Mono, monospace' }}>{fileName}</div>}
    </div>
  )
}

// ── Painel de conferência ─────────────────────────────────────────────────────
function PainelNFSe({ dados }) {
  const res = verificarNFSe(dados)
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>NFS-e</span>
        <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'DM Mono, monospace' }}>Nº {dados.cNF}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>
        <span>Valor serviço: <strong style={{ color: 'var(--text)' }}>{fmtMoeda(dados.vServ)}</strong></span>
        <span>ISS: <strong style={{ color: 'var(--text)' }}>{fmtMoeda(dados.vISS)} ({fmtNum(dados.pAliqISS)}%)</strong></span>
        <span>cIndOp: <strong style={{ color: 'var(--text)' }}>{dados.cIndOp}</strong></span>
      </div>
      <CheckResult {...res} />
    </div>
  )
}

function PainelNFe({ dados, tipo, tipoLabel, parResult }) {
  const res = verificarNFe(dados, tipo)
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>NF-e — {tipoLabel}</span>
        <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'DM Mono, monospace' }}>Nº {dados.nNF} · {dados.CFOP}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-2)', marginBottom: 8 }}>
        <span>vProd: <strong style={{ color: 'var(--text)' }}>{fmtMoeda(dados.vProd)}</strong></span>
        <span>ICMS: <strong style={{ color: 'var(--text)' }}>{fmtMoeda(dados.vICMS)}</strong></span>
        {dados.vICMSST > 0 && <span>ICMS-ST: <strong style={{ color: 'var(--text)' }}>{fmtMoeda(dados.vICMSST)}</strong></span>}
        <span>UF dest: <strong style={{ color: 'var(--text)' }}>{dados.UF_dest}</strong></span>
      </div>
      <CheckResult {...res} />
      {parResult && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', margin: '12px 0 4px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Par de conserto (entrada ↔ saída)</div>
          <CheckResult {...parResult} />
        </>
      )}
    </div>
  )
}

// ── Checklist "Antes de dar ok" ───────────────────────────────────────────────
const checklistNFSe = [
  'CNPJ prestador = Gera Vale (19.090.416/0001-76)',
  'cTribNac = 140101 (manutenção) ou 100901 (óleo)',
  'cTribMun = 0068',
  'cIndOp correto para o caso',
  'Local de prestação = SJC (3549904)',
  'ISS 3%',
  'PIS 0,65% / COFINS 3% — CST 01',
  'Retenção PIS/COFINS 4,65% (tpRetPisCofins = 3)',
]
const checklistNFeOleo = [
  'CFOP 5405 (SP) ou 6403 (interestadual)',
  'NCM 3403.99.00',
  'CEST 06.017.00',
  'Origem 2 (estrangeiro procedência conhecida)',
  'ICMS 4%',
  'ICMS-ST correto para o estado de destino',
  'Base PIS/COFINS = vProd − ICMS próprio',
  'PIS 1,65% / COFINS 7,6%',
]
const checklistNFeConserto = [
  'NF entrada (5915/6915) + NF saída (5916/6916)',
  'Itens e valores iguais na entrada e retorno',
  'CNPJ destinatário na saída = CNPJ remetente na entrada',
  'Série correta',
]

function Checklist({ items, title }) {
  const [checked, setChecked] = useState({})
  const toggle = i => setChecked(c => ({ ...c, [i]: !c[i] }))
  const todos = items.every((_, i) => checked[i])

  return (
    <div style={{ background: 'var(--bg-2)', border: `1px solid ${todos ? 'var(--green)' : 'var(--border)'}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)' }}>{title}</span>
        {todos && <span style={{ fontSize: 11, color: 'var(--green-text)', background: 'var(--green-bg)', padding: '1px 8px', borderRadius: 20 }}>✓ Tudo certo</span>}
      </div>
      {items.map((item, i) => (
        <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', cursor: 'pointer', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <input type="checkbox" checked={!!checked[i]} onChange={() => toggle(i)}
            style={{ width: 15, height: 15, accentColor: 'var(--blue)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: checked[i] ? 'var(--text-3)' : 'var(--text)', textDecoration: checked[i] ? 'line-through' : 'none', transition: 'color .15s' }}>
            {item}
          </span>
        </label>
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Conferidor() {
  const [tab, setTab] = useState('verificacao') // 'verificacao' | 'checklist'
  const [nfseData, setNfseData] = useState(null)
  const [nfseFileName, setNfseFileName] = useState('')
  const [nfseError, setNfseError] = useState('')
  const [nfeOleoData, setNfeOleoData] = useState(null)
  const [nfeOleoFileName, setNfeOleoFileName] = useState('')
  const [nfeOleoError, setNfeOleoError] = useState('')
  const [nfeConsertoEntData, setNfeConsertoEntData] = useState(null)
  const [nfeConsertoEntFileName, setNfeConsertoEntFileName] = useState('')
  const [nfeConsertoEntError, setNfeConsertoEntError] = useState('')
  const [nfeConsertoSaiData, setNfeConsertoSaiData] = useState(null)
  const [nfeConsertoSaiFileName, setNfeConsertoSaiFileName] = useState('')
  const [nfeConsertoSaiError, setNfeConsertoSaiError] = useState('')

  function tryParseNFSe(xml, name) {
    try {
      const d = parseNFSe(xml)
      setNfseData(d)
      setNfseFileName(name)
      setNfseError('')
    } catch (e) {
      setNfseError(e.message)
      setNfseData(null)
    }
  }
  function tryParseNFeOleo(xml, name) {
    try {
      const d = parseNFe(xml)
      setNfeOleoData(d)
      setNfeOleoFileName(name)
      setNfeOleoError('')
    } catch (e) {
      setNfeOleoError(e.message)
      setNfeOleoData(null)
    }
  }
  function tryParseNFeConsertoEnt(xml, name) {
    try {
      const d = parseNFe(xml)
      setNfeConsertoEntData(d)
      setNfeConsertoEntFileName(name)
      setNfeConsertoEntError('')
    } catch (e) {
      setNfeConsertoEntError(e.message)
      setNfeConsertoEntData(null)
    }
  }
  function tryParseNFeConsertoSai(xml, name) {
    try {
      const d = parseNFe(xml)
      setNfeConsertoSaiData(d)
      setNfeConsertoSaiFileName(name)
      setNfeConsertoSaiError('')
    } catch (e) {
      setNfeConsertoSaiError(e.message)
      setNfeConsertoSaiData(null)
    }
  }

  const parConserto = (nfeConsertoEntData && nfeConsertoSaiData)
    ? verificarParConserto(nfeConsertoEntData, nfeConsertoSaiData)
    : null

  const tabStyle = active => ({
    padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: active ? 600 : 400,
    cursor: 'pointer', background: active ? 'var(--bg-3)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text-2)', border: 'none',
    transition: 'background .15s, color .15s'
  })

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav crumbs={[{ label: 'Conferidor de Notas' }]} />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 28px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Conferidor de Notas</h1>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
            Arraste ou selecione XMLs para conferência automática — NFS-e e NF-e
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
          <button style={tabStyle(tab === 'verificacao')} onClick={() => setTab('verificacao')}>Verificação automática</button>
          <button style={tabStyle(tab === 'checklist')} onClick={() => setTab('checklist')}>Checklist manual</button>
        </div>

        {tab === 'verificacao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* NFS-e */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10 }}>NFS-e — Serviço</div>
              <DropZone label="Arraste o XML da NFS-e aqui" onFile={tryParseNFSe} fileName={nfseFileName} color="var(--blue)" />
              {nfseError && <div style={{ fontSize: 11, color: 'var(--red-text)', marginTop: 6 }}>✕ {nfseError}</div>}
              {nfseData && <PainelNFSe dados={nfseData} />}
            </div>

            {/* NF-e Óleo */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10 }}>NF-e — Óleo / Lubrificante</div>
              <DropZone label="Arraste o XML da NF-e de óleo aqui" onFile={tryParseNFeOleo} fileName={nfeOleoFileName} color="var(--orange)" />
              {nfeOleoError && <div style={{ fontSize: 11, color: 'var(--red-text)', marginTop: 6 }}>✕ {nfeOleoError}</div>}
              {nfeOleoData && <PainelNFe dados={nfeOleoData} tipo="oleo" tipoLabel="Óleo / Lubrificante" />}
            </div>

            {/* NF-e Conserto */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10 }}>NF-e — Conserto (par entrada + retorno)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>Remessa para conserto (5915/6915)</div>
                  <DropZone label="XML de entrada" onFile={tryParseNFeConsertoEnt} fileName={nfeConsertoEntFileName} color="var(--yellow-text)" />
                  {nfeConsertoEntError && <div style={{ fontSize: 11, color: 'var(--red-text)', marginTop: 6 }}>✕ {nfeConsertoEntError}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>Retorno do conserto (5916/6916)</div>
                  <DropZone label="XML de retorno" onFile={tryParseNFeConsertoSai} fileName={nfeConsertoSaiFileName} color="var(--yellow-text)" />
                  {nfeConsertoSaiError && <div style={{ fontSize: 11, color: 'var(--red-text)', marginTop: 6 }}>✕ {nfeConsertoSaiError}</div>}
                </div>
              </div>
              {nfeConsertoEntData && <PainelNFe dados={nfeConsertoEntData} tipo="conserto_entrada" tipoLabel="Remessa para conserto" parResult={parConserto} />}
              {nfeConsertoSaiData && <PainelNFe dados={nfeConsertoSaiData} tipo="conserto_saida" tipoLabel="Retorno do conserto" />}
            </div>

          </div>
        )}

        {tab === 'checklist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Checklist title="NFS-e — Serviço" items={checklistNFSe} />
            <Checklist title="NF-e — Óleo / Lubrificante" items={checklistNFeOleo} />
            <Checklist title="NF-e — Conserto" items={checklistNFeConserto} />
          </div>
        )}
      </div>
    </div>
  )
}
