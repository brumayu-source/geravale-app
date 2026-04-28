import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function gerarPDFBaixa({ cliente, contrato, equipamento, baixas, pecas }) {
  const doc = new jsPDF()
  const hoje = new Date()
  const fmtDate = (iso) => {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(31, 56, 100)
  doc.text('GERA VALE KOMPRESOREN', 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text('Telefone: (12) 9979-49586  |  CNPJ: 19.090.416/0001-76', 14, 24)
  doc.text('geravale@geravale.com.br', 14, 29)

  // Linha separadora
  doc.setDrawColor(31, 56, 100)
  doc.setLineWidth(0.5)
  doc.line(14, 33, 196, 33)

  // Título do documento
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(31, 56, 100)
  doc.text('COMPROVANTE DE CONSUMO DE PEÇAS', 14, 41)

  // Dados do contrato
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(60)

  const tipoLabel = contrato.tipo === 'manutencao' ? 'Manutenção' : 'Locação'
  const info = [
    ['Cliente', cliente.razao_social],
    ['CNPJ', cliente.cnpj || '—'],
    ['Contrato', `#${contrato.numero}  (${tipoLabel})`],
    ['Equipamento', `${equipamento.fabricante} ${equipamento.modelo}  ·  Série ${equipamento.serie}`],
  ]

  let y = 49
  info.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value || '—', 42, y)
    y += 6
  })

  // OS e data — destaque
  const primeiraOS = baixas[0]?.os || '—'
  const primeiraData = baixas[0]?.data || ''

  doc.setFillColor(240, 245, 255)
  doc.roundedRect(14, y + 1, 182, 10, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(31, 56, 100)
  doc.text(`OS: ${primeiraOS}`, 18, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80)
  doc.text(`Data: ${fmtDate(primeiraData)}`, 80, y + 8)
  y += 18

  // Tabela de peças
  const rows = baixas.map(b => {
    const peca = pecas.find(p => p.id === b.peca_id)
    return [
      peca?.descricao || '—',
      peca?.codigo || '—',
      String(b.qtd),
      peca?.unidade || '—',
      b.re_nf || '—',
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Descrição', 'Código', 'Qtd', 'Unid.', 'RE / NF']],
    body: rows,
    headStyles: {
      fillColor: [31, 56, 100],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 9, textColor: 40 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 35 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
  })

  // Rodapé
  const finalY = doc.lastAutoTable.finalY + 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    `Gerado em: ${hoje.toLocaleDateString('pt-BR')} às ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    14,
    finalY
  )
  doc.text('Gera Vale Kompresoren — Documento interno de controle de estoque', 14, finalY + 5)

  // Salvar
  const nomeArquivo = `baixa_${equipamento.serie}_${primeiraOS}_${hoje.toISOString().slice(0, 10)}.pdf`
  doc.save(nomeArquivo)
}
