import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function gerarPDFVisita({ cliente, contrato, equipamento, visita, baixas, pecas, userEmail }) {
  const doc = new jsPDF()
  const hoje = new Date()

  const fmtDate = (iso) => {
    if (!iso) return '—'
    const d = iso.includes('T') ? iso.split('T')[0] : iso
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  const tipoLabel = contrato.tipo === 'manutencao' ? 'Manutenção' : 'Locação'
  const visitaTipo = visita?.tipo === 'corretiva' ? 'Corretiva' : 'Preventiva'

  // Cabeçalho
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(31, 56, 100)
  doc.text('GERA VALE KOMPRESOREN', 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text('Tel: (12) 9979-49586  ·  CNPJ: 19.090.416/0001-76  ·  geravale@geravale.com.br', 14, 25)

  doc.setDrawColor(31, 56, 100)
  doc.setLineWidth(0.5)
  doc.line(14, 29, 196, 29)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(31, 56, 100)
  doc.text('RELATÓRIO DE CONSUMO DE PEÇAS', 14, 38)

  // Bloco de informações
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(50)

  const col1 = 14, col2 = 50, col3 = 110, col4 = 145
  let y = 48

  const linha = (l1, v1, l2, v2) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(100)
    doc.text(l1, col1, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30)
    doc.text(v1 || '—', col2, y)
    if (l2) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(100)
      doc.text(l2, col3, y)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(30)
      doc.text(v2 || '—', col4, y)
    }
    y += 7
  }

  linha('Cliente:', cliente.razao_social, 'CNPJ:', cliente.cnpj)
  linha('Contrato:', `#${contrato.numero} (${tipoLabel})`, 'NF necessária:', contrato.nota_fiscal ? 'Sim' : 'Não')
  linha('Equipamento:', `${equipamento.fabricante} ${equipamento.modelo}`, 'Série:', equipamento.serie)
  linha('Localização:', equipamento.localizacao || '—', 'Ano:', String(equipamento.ano || '—'))

  y += 2

  // Destaque OS
  doc.setFillColor(236, 243, 255)
  doc.roundedRect(14, y, 182, 13, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(31, 56, 100)
  doc.text(`OS: ${visita?.os || baixas[0]?.os || '—'}`, 19, y + 9)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(60)
  doc.text(`Data: ${fmtDate(visita?.data || baixas[0]?.data)}`, 70, y + 9)
  doc.text(`Tipo: ${visitaTipo}`, 120, y + 9)
  if (visita?.horas) doc.text(`Horas: ${visita.horas}h`, 158, y + 9)
  y += 20

  // Tabela de peças
  const rows = baixas.map(b => {
    const peca = pecas.find(p => p.id === b.peca_id)
    return [peca?.descricao || '—', peca?.codigo || '—', String(b.qtd), peca?.unidade || '—', b.re_nf || '—']
  })

  autoTable(doc, {
    startY: y,
    head: [['Descrição da Peça', 'Código', 'Qtd', 'Unid.', 'RE / NF']],
    body: rows,
    headStyles: { fillColor: [31, 56, 100], textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: 40 },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: {
      0: { cellWidth: 75 }, 1: { cellWidth: 32 },
      2: { cellWidth: 18, halign: 'center' }, 3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 39 },
    },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 16

  // Observações
  if (visita?.obs) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(100)
    doc.text('Observações:', 14, y)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(50)
    doc.text(visita.obs, 42, y)
    y += 12
  }

  // Assinatura
  if (y > 240) { doc.addPage(); y = 20 }
  y += 6

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100)
  doc.text('Registrado por:', 14, y)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(40)
  doc.text(userEmail || '—', 50, y)
  y += 14

  doc.setDrawColor(180); doc.setLineWidth(0.3)
  doc.line(14, y, 100, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120)
  doc.text('Assinatura do responsável', 14, y + 5)

  const geradoEm = `Gerado em: ${hoje.toLocaleDateString('pt-BR')} às ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  doc.text(geradoEm, 196, y + 5, { align: 'right' })

  const os = visita?.os || baixas[0]?.os || 'sem-os'
  const data = (visita?.data || baixas[0]?.data || hoje.toISOString().slice(0, 10)).slice(0, 10)
  doc.save(`consumo_${equipamento.serie}_OS${os}_${data}.pdf`)
}
