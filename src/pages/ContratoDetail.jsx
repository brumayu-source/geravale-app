import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import { PageHeader, Section, InfoGrid, Btn, Badge, MetricCard, Modal, FormGroup, FormRow, BtnRow, Confirm, fmtDate } from '../components/ui'

function EquipForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    fabricante: '', modelo: '', serie: '', ano: '',
    part_number: '', localizacao: '', ...initial
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <>
      <FormRow>
        <FormGroup label="Fabricante"><input value={form.fabricante} onChange={e => set('fabricante', e.target.value)} /></FormGroup>
        <FormGroup label="Modelo" required><input value={form.modelo} onChange={e => set('modelo', e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Nº de Série (único)" required><input value={form.serie} onChange={e => set('serie', e.target.value)} /></FormGroup>
        <FormGroup label="Ano de Fabricação"><input type="number" value={form.ano} onChange={e => set('ano', e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Part Number"><input value={form.part_number} onChange={e => set('part_number', e.target.value)} /></FormGroup>
        <FormGroup label="Localização / Planta"><input value={form.localizacao} onChange={e => set('localizacao', e.target.value)} /></FormGroup>
      </FormRow>
      <BtnRow>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => onSave(form)}>Salvar</Btn>
      </BtnRow>
    </>
  )
}

function VisitaForm({ onSave, onClose }) {
  const [form, setForm] = useState({ data: '', os: '', tipo: 'preventiva', horas: '', km: '', obs: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <>
      <FormRow>
        <FormGroup label="Data" required><input type="date" value={form.data} onChange={e => set('data', e.target.value)} /></FormGroup>
        <FormGroup label="Nº OS" required><input value={form.os} onChange={e => set('os', e.target.value)} placeholder="Ex: 72831844" /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Tipo">
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="preventiva">Preventiva</option>
            <option value="corretiva">Corretiva</option>
          </select>
        </FormGroup>
        <FormGroup label="Horas trabalhadas" required><input type="number" min="0" step="0.5" value={form.horas} onChange={e => set('horas', e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="KM percorridos" required><input type="number" min="0" value={form.km} onChange={e => set('km', e.target.value)} /></FormGroup>
        <FormGroup label="Observações"><input value={form.obs} onChange={e => set('obs', e.target.value)} /></FormGroup>
      </FormRow>
      <BtnRow>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => { if (!form.data || !form.os || !form.horas || !form.km) return; onSave(form) }}>Salvar Visita</Btn>
      </BtnRow>
    </>
  )
}

export default function ContratoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contrato, setContrato] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [equipamentos, setEquipamentos] = useState([])
  const [visitas, setVisitas] = useState([])
  const [modal, setModal] = useState(null)

  useEffect(() => { load() }, [id])

  async function load() {
    const { data: ct } = await supabase.from('contratos').select('*, clientes(*)').eq('id', id).single()
    setContrato(ct)
    setCliente(ct?.clientes)
    const [{ data: eqs }, { data: vs }] = await Promise.all([
      supabase.from('equipamentos').select('*').eq('contrato_id', id).eq('arquivado', false).order('modelo'),
      ct?.tipo === 'manutencao' ? supabase.from('visitas').select('*').eq('contrato_id', id).order('data', { ascending: false }) : Promise.resolve({ data: [] })
    ])
    setEquipamentos(eqs || [])
    setVisitas(vs || [])
  }

  async function saveEquip(form) {
    if (modal?.id && modal?._action === 'edit') {
      await supabase.from('equipamentos').update({ ...form, updated_at: new Date() }).eq('id', modal.id)
    } else {
      await supabase.from('equipamentos').insert({ ...form, contrato_id: id })
    }
    setModal(null)
    load()
  }

  async function saveVisita(form) {
    await supabase.from('visitas').insert({ ...form, contrato_id: id })
    setModal(null)
    load()
  }

  async function excluirEquip(eid) {
    await supabase.from('equipamentos').update({ arquivado: true }).eq('id', eid)
    setModal(null)
    load()
  }

  if (!contrato) return <div style={{ padding: 28, color: 'var(--text-2)' }}>Carregando...</div>

  const horasUsadas = visitas.reduce((s, v) => s + (+v.horas || 0), 0)
  const kmUsados = visitas.reduce((s, v) => s + (+v.km || 0), 0)
  const hPct = contrato.horas_contratadas > 0 ? (horasUsadas / contrato.horas_contratadas) * 100 : 0
  const kPct = contrato.km_contratados > 0 ? (kmUsados / contrato.km_contratados) * 100 : 0
  const barColor = (pct) => pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--yellow-text)' : 'var(--green)'

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav crumbs={[
        { label: 'Clientes', to: '/clientes' },
        { label: cliente?.razao_social, to: `/clientes/${cliente?.id}` },
        { label: `Contrato #${contrato.numero}` }
      ]} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Badge tipo={contrato.tipo} />
          <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Contrato #{contrato.numero}</span>
        </div>
        <PageHeader
          title={cliente?.razao_social}
          subtitle={`${fmtDate(contrato.inicio)} → ${fmtDate(contrato.termino)}`}
          actions={
            <div style={{ display: 'flex', gap: 8 }}>
              {contrato.tipo === 'manutencao' && <Btn variant="secondary" size="sm" onClick={() => setModal('visita')}>+ Registrar visita</Btn>}
              <Btn onClick={() => setModal('newEquip')}>+ Equipamento</Btn>
            </div>
          }
        />

        <Section title="Informações do Contrato">
          <InfoGrid items={[
            ['Tipo', contrato.tipo === 'manutencao' ? 'Manutenção' : 'Locação'],
            ['Número / Pedido', contrato.numero],
            ['Início', fmtDate(contrato.inicio)],
            ['Término', fmtDate(contrato.termino)],
            ['Nota Fiscal', contrato.nota_fiscal ? 'Sim' : 'Não'],
            ['APR', contrato.apr ? 'Sim' : 'Não'],
          ]} />
        </Section>

        {contrato.tipo === 'manutencao' && (
          <Section title="Horas & Deslocamento">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
              <MetricCard label="Horas contratadas" value={contrato.horas_contratadas} unit="h" />
              <MetricCard label="Horas utilizadas" value={horasUsadas} unit="h" barPct={hPct} barColor={barColor(hPct)} />
              <MetricCard label="Saldo horas" value={contrato.horas_contratadas - horasUsadas} unit="h" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <MetricCard label="KM contratados" value={contrato.km_contratados} unit="km" />
              <MetricCard label="KM utilizados" value={kmUsados} unit="km" barPct={kPct} barColor={barColor(kPct)} />
              <MetricCard label="Saldo KM" value={contrato.km_contratados - kmUsados} unit="km" />
            </div>
          </Section>
        )}

        <Section title={`Equipamentos (${equipamentos.length})`}>
          {equipamentos.map(eq => (
            <div key={eq.id}
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '11px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color .15s' }}
              onClick={() => navigate(`/equipamentos/${eq.id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-3)', overflow: 'hidden', flexShrink: 0 }}>
                  {eq.foto_url
                    ? <img src={eq.foto_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚙️</div>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{eq.fabricante} {eq.modelo} · Série {eq.serie}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>{eq.ano} · {eq.localizacao}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={e => { e.stopPropagation(); setModal({ ...eq, _action: 'edit' }) }}
                  style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 6, color: 'var(--text-2)', padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setModal({ ...eq, _action: 'delete' }) }}
                  style={{ background: 'none', border: '1px solid var(--red-bg)', borderRadius: 6, color: 'var(--red-text)', padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Excluir</button>
                <span style={{ color: 'var(--border-2)', fontSize: 12 }}>›</span>
              </div>
            </div>
          ))}
          {equipamentos.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>Nenhum equipamento cadastrado.</p>}
        </Section>
      </div>

      {(modal === 'newEquip' || modal?._action === 'edit') && (
        <Modal title={modal === 'newEquip' ? 'Novo Equipamento' : 'Editar Equipamento'} onClose={() => setModal(null)} width={520}>
          <EquipForm initial={modal !== 'newEquip' ? modal : {}} onSave={saveEquip} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal === 'visita' && (
        <Modal title="Registrar Visita" onClose={() => setModal(null)} width={520}>
          <VisitaForm onSave={saveVisita} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?._action === 'delete' && (
        <Confirm
          danger
          message={`Excluir equipamento "${modal.fabricante} ${modal.modelo} · ${modal.serie}"? Esta ação não pode ser desfeita.`}
          onConfirm={() => excluirEquip(modal.id)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
