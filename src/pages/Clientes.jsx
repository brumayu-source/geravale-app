import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Nav from '../components/Nav'
import { PageHeader, Btn, Badge, Modal, FormGroup, FormRow, BtnRow, Confirm, initials } from '../components/ui'

function ClienteForm({ initial = {}, onSave, onClose }) {
  const [form, setForm] = useState({
    razao_social: '', cnpj: '', endereco: '',
    contato_tecnico: '', contato_compras: '', contato_fiscal: '',
    ...initial
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.razao_social) return
    onSave(form)
  }

  return (
    <>
      <FormRow>
        <FormGroup label="Razão Social" required><input value={form.razao_social} onChange={e => set('razao_social', e.target.value)} /></FormGroup>
        <FormGroup label="CNPJ"><input value={form.cnpj} onChange={e => set('cnpj', e.target.value)} /></FormGroup>
      </FormRow>
      <FormGroup label="Endereço"><input value={form.endereco} onChange={e => set('endereco', e.target.value)} /></FormGroup>
      <FormRow>
        <FormGroup label="Contato Técnico"><input value={form.contato_tecnico} onChange={e => set('contato_tecnico', e.target.value)} /></FormGroup>
        <FormGroup label="Contato Compras"><input value={form.contato_compras} onChange={e => set('contato_compras', e.target.value)} /></FormGroup>
      </FormRow>
      <FormGroup label="Contato Fiscal / E-mail NF"><input value={form.contato_fiscal} onChange={e => set('contato_fiscal', e.target.value)} /></FormGroup>
      <BtnRow>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave}>Salvar</Btn>
      </BtnRow>
    </>
  )
}

export default function Clientes() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState([])
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'new' | {edit} | {archive} | {delete}

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [{ data: cls }, { data: cts }] = await Promise.all([
      supabase.from('clientes').select('*').eq('arquivado', false).order('razao_social'),
      supabase.from('contratos').select('id, cliente_id, tipo, arquivado').eq('arquivado', false)
    ])
    setClientes(cls || [])
    setContratos(cts || [])
    setLoading(false)
  }

  async function saveCliente(form) {
    const { _action, id, created_at, updated_at, arquivado, ...payload } = form
    if (modal?.id) {
      await supabase.from('clientes').update({ ...payload, updated_at: new Date() }).eq('id', modal.id)
    } else {
      await supabase.from('clientes').insert(payload)
    }
    setModal(null)
    load()
  }

  async function arquivar(id) {
    await supabase.from('clientes').update({ arquivado: true }).eq('id', id)
    setModal(null)
    load()
  }

  const sorted = [...clientes].sort((a, b) => a.razao_social.localeCompare(b.razao_social))

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav crumbs={[{ label: 'Clientes' }]} />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 28px' }}>
        <PageHeader
          title="Clientes"
          subtitle={`${clientes.length} cadastrado${clientes.length !== 1 ? 's' : ''}`}
          actions={<Btn onClick={() => setModal('new')}>+ Novo Cliente</Btn>}
        />

        {loading && <p style={{ color: 'var(--text-2)', fontSize: 13 }}>Carregando...</p>}

        {sorted.map(cl => {
          const cts = contratos.filter(c => c.cliente_id === cl.id)
          const tipos = [...new Set(cts.map(c => c.tipo))]
          return (
            <div key={cl.id}
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color .15s' }}
              onClick={() => navigate(`/clientes/${cl.id}`)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--blue-text)', flexShrink: 0 }}>
                  {initials(cl.razao_social)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{cl.razao_social}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>{cl.cnpj}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {tipos.map(t => <Badge key={t} tipo={t} />)}
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-3)', color: 'var(--text-2)' }}>{cts.length} contrato{cts.length !== 1 ? 's' : ''}</span>
                <button onClick={e => { e.stopPropagation(); setModal({ ...cl, _action: 'edit' }) }}
                  style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 6, color: 'var(--text-2)', padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setModal({ ...cl, _action: 'archive' }) }}
                  style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 6, color: 'var(--text-3)', padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}>Arquivar</button>
                <span style={{ color: 'var(--border-2)', fontSize: 12 }}>›</span>
              </div>
            </div>
          )
        })}
      </div>

      {(modal === 'new' || modal?._action === 'edit') && (
        <Modal title={modal === 'new' ? 'Novo Cliente' : 'Editar Cliente'} onClose={() => setModal(null)} width={560}>
          <ClienteForm initial={modal !== 'new' ? modal : {}} onSave={saveCliente} onClose={() => setModal(null)} />
        </Modal>
      )}

      {modal?._action === 'archive' && (
        <Confirm
          message={`Arquivar "${modal.razao_social}"? O cliente e seus contratos ficam ocultos mas não são excluídos.`}
          onConfirm={() => arquivar(modal.id)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
