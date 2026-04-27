import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import { PageHeader, Section, InfoGrid, Btn, Badge, Modal, FormGroup, FormRow, BtnRow, Confirm, fmtDate } from '../components/ui'

function ContratoForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    numero: '', tipo: 'manutencao', inicio: '', termino: '',
    nota_fiscal: false, apr: false,
    horas_contratadas: 0, km_contratados: 0,
    ...initial
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <FormRow>
        <FormGroup label="Nº do Contrato / Pedido" required>
          <input value={form.numero} onChange={e => set('numero', e.target.value)} />
        </FormGroup>
        <FormGroup label="Tipo" required>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="manutencao">Manutenção</option>
            <option value="locacao">Locação</option>
          </select>
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Data de Início"><input type="date" value={form.inicio} onChange={e => set('inicio', e.target.value)} /></FormGroup>
        <FormGroup label="Data de Término"><input type="date" value={form.termino} onChange={e => set('termino', e.target.value)} /></FormGroup>
      </FormRow>
      {form.tipo === 'manutencao' && (
        <FormRow>
          <FormGroup label="Total Horas Contratadas"><input type="number" min="0" value={form.horas_contratadas} onChange={e => set('horas_contratadas', +e.target.value)} /></FormGroup>
          <FormGroup label="Total KM Contratados"><input type="number" min="0" value={form.km_contratados} onChange={e => set('km_contratados', +e.target.value)} /></FormGroup>
        </FormRow>
      )}
      <FormRow>
        <FormGroup label="Nota Fiscal Necessária?">
          <select value={form.nota_fiscal ? 'sim' : 'nao'} onChange={e => set('nota_fiscal', e.target.value === 'sim')}>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </FormGroup>
        <FormGroup label="APR Necessária?">
          <select value={form.apr ? 'sim' : 'nao'} onChange={e => set('apr', e.target.value === 'sim')}>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </FormGroup>
      </FormRow>
      <BtnRow>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => onSave(form)}>Salvar</Btn>
      </BtnRow>
    </>
  )
}

export default function ClienteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [contratos, setContratos] = useState([])
  const [modal, setModal] = useState(null)

  useEffect(() => { load() }, [id])

  async function load() {
    const [{ data: cl }, { data: cts }] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', id).single(),
      supabase.from('contratos').select('*').eq('cliente_id', id).eq('arquivado', false).order('created_at', { ascending: false })
    ])
    setCliente(cl)
    setContratos(cts || [])
  }

  async function saveContrato(form) {
    if (modal?.id && modal?._action === 'edit') {
      await supabase.from('contratos').update({ ...form, updated_at: new Date() }).eq('id', modal.id)
    } else {
      await supabase.from('contratos').insert({ ...form, cliente_id: id })
    }
    setModal(null)
    load()
  }

  async function arquivarContrato(cid) {
    await supabase.from('contratos').update({ arquivado: true }).eq('id', cid)
    setModal(null)
    load()
  }

  if (!cliente) return <div style={{ padding: 28, color: 'var(--text-2)' }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav crumbs={[{ label: 'Clientes', to: '/clientes' }, { label: cliente.razao_social }]} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 28px' }}>
        <PageHeader
          title={cliente.razao_social}
          subtitle={cliente.cnpj}
          actions={
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" size="sm" onClick={() => setModal({ ...cliente, _action: 'editCliente' })}>Editar</Btn>
              <Btn onClick={() => setModal('newContrato')}>+ Novo Contrato</Btn>
            </div>
          }
        />

        <Section title="Informações">
          <InfoGrid items={[
            ['Razão Social', cliente.razao_social],
            ['CNPJ', cliente.cnpj],
            ['Endereço', cliente.endereco],
            ['Contato Técnico', cliente.contato_tecnico],
            ['Contato Compras', cliente.contato_compras],
            ['Contato Fiscal', cliente.contato_fiscal],
          ]} />
        </Section>

        <Section title={`Contratos (${contratos.length})`}>
          {contratos.map(ct => (
            <div key={ct.id}
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '11px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color .15s' }}
              onClick={() => navigate(`/contratos/${ct.id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = ct.tipo === 'locacao' ? 'var(--orange)' : 'var(--blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📄</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Contrato #{ct.numero}</span>
                    <Badge tipo={ct.tipo} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>{fmtDate(ct.inicio)} → {fmtDate(ct.termino)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={e => { e.stopPropagation(); setModal({ ...ct, _action: 'edit' }) }}
                  style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 6, color: 'var(--text-2)', padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setModal({ ...ct, _action: 'archive' }) }}
                  style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 6, color: 'var(--text-3)', padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Arquivar</button>
                <span style={{ color: 'var(--border-2)', fontSize: 12 }}>›</span>
              </div>
            </div>
          ))}
          {contratos.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>Nenhum contrato cadastrado.</p>}
        </Section>
      </div>

      {(modal === 'newContrato' || modal?._action === 'edit') && (
        <Modal title={modal === 'newContrato' ? 'Novo Contrato' : 'Editar Contrato'} onClose={() => setModal(null)} width={560}>
          <ContratoForm initial={modal !== 'newContrato' ? modal : {}} onSave={saveContrato} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?._action === 'archive' && (
        <Confirm
          message={`Arquivar contrato #${modal.numero}?`}
          onConfirm={() => arquivarContrato(modal.id)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
