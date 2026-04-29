import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import Nav from '../components/Nav'
import { PageHeader, Section, InfoGrid, Btn, Badge, SaldoBadge, Modal, FormGroup, FormRow, BtnRow, Confirm, fmtDate } from '../components/ui'
import { gerarPDFVisita } from '../lib/pdf'

// ── Formulário de peça ────────────────────────────────────────────────────────
function PecaForm({ initial = {}, tipo, onSave, onClose }) {
  const [form, setForm] = useState({
    descricao: '', codigo: '', unidade: 'PC', tipo: '', qtd_contratada: 0, obs: '', ...initial
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <>
      <FormRow>
        <FormGroup label="Descrição" required><input value={form.descricao} onChange={e => set('descricao', e.target.value)} /></FormGroup>
        <FormGroup label="Código da Peça"><input value={form.codigo} onChange={e => set('codigo', e.target.value)} /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Unidade">
          <select value={form.unidade} onChange={e => set('unidade', e.target.value)}>
            <option value="PC">PC (Peça)</option>
            <option value="LT">LT (Litro)</option>
            <option value="KG">KG (Quilo)</option>
            <option value="UN">UN (Unidade)</option>
          </select>
        </FormGroup>
        <FormGroup label="Tipo"><input value={form.tipo} onChange={e => set('tipo', e.target.value)} placeholder="Filtro, Óleo, Kit..." /></FormGroup>
      </FormRow>
      {tipo === 'manutencao' && (
        <FormGroup label="Qtd. Contratada">
          <input type="number" min="0" value={form.qtd_contratada} onChange={e => set('qtd_contratada', +e.target.value)} />
        </FormGroup>
      )}
      <FormGroup label="Observações / Especificações">
        <input value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Ex: Genuíno, Kaeser..." />
      </FormGroup>
      <BtnRow>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={() => { if (!form.descricao) return; onSave(form) }}>Salvar</Btn>
      </BtnRow>
    </>
  )
}

// ── Formulário de baixa — agora com seleção de visita ────────────────────────
function BaixaForm({ peca, visitas, onSave, onClose }) {
  const [form, setForm] = useState({ visita_id: '', qtd: '', re_nf: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const visitaSelecionada = visitas.find(v => v.id === form.visita_id)

  return (
    <>
      {/* Identificação da peça */}
      <div style={{ background: 'var(--bg-3)', borderRadius: 'var(--radius)', padding: '8px 12px', marginBottom: 14, fontSize: 12, color: 'var(--text-2)' }}>
        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{peca.descricao}</span> · {peca.codigo}
      </div>

      {/* Seleção de visita */}
      <FormGroup label="Visita / OS" required>
        <select value={form.visita_id} onChange={e => set('visita_id', e.target.value)}>
          <option value="">Selecione a visita...</option>
          {visitas.map(v => (
            <option key={v.id} value={v.id}>
              OS {v.os} · {fmtDate(v.data)} · {v.tipo === 'corretiva' ? 'Corretiva' : 'Preventiva'}
            </option>
          ))}
        </select>
      </FormGroup>

      {/* Mostra resumo da visita selecionada */}
      {visitaSelecionada && (
        <div style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue)', borderRadius: 'var(--radius)', padding: '8px 12px', marginBottom: 14, fontSize: 11, color: 'var(--blue-text)' }}>
          {fmtDate(visitaSelecionada.data)} · {visitaSelecionada.horas}h · {visitaSelecionada.km}km
          {visitaSelecionada.obs && ` · ${visitaSelecionada.obs}`}
        </div>
      )}

      <FormRow>
        <FormGroup label="Quantidade" required>
          <input type="number" min="1" value={form.qtd} onChange={e => set('qtd', e.target.value)} />
        </FormGroup>
        <FormGroup label="RE / NF">
          <input value={form.re_nf} onChange={e => set('re_nf', e.target.value)} placeholder="Número da nota ou RE" />
        </FormGroup>
      </FormRow>

      <BtnRow>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn
          disabled={!form.visita_id || !form.qtd}
          onClick={() => onSave({
            visita_id: form.visita_id,
            data: visitaSelecionada.data,
            os: visitaSelecionada.os,
            qtd: +form.qtd,
            re_nf: form.re_nf,
          })}
        >
          Salvar Baixa
        </Btn>
      </BtnRow>
    </>
  )
}

// ── Modal de seleção de visita para gerar PDF ─────────────────────────────────
function GerarPDFModal({ visitas, onGerar, onClose }) {
  const [visitaId, setVisitaId] = useState('')
  return (
    <Modal title="Gerar PDF da Visita" onClose={onClose} width={420}>
      <FormGroup label="Selecione a visita" required>
        <select value={visitaId} onChange={e => setVisitaId(e.target.value)}>
          <option value="">Selecione...</option>
          {visitas.map(v => (
            <option key={v.id} value={v.id}>
              OS {v.os} · {fmtDate(v.data)} · {v.tipo === 'corretiva' ? 'Corretiva' : 'Preventiva'}
            </option>
          ))}
        </select>
      </FormGroup>
      <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 16 }}>
        O PDF incluirá todas as baixas de peças registradas nesta visita.
      </p>
      <BtnRow>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn disabled={!visitaId} onClick={() => onGerar(visitaId)}>Gerar PDF</Btn>
      </BtnRow>
    </Modal>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function EquipamentoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const fileRef = useRef()

  const [equip, setEquip] = useState(null)
  const [contrato, setContrato] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [pecas, setPecas] = useState([])
  const [baixas, setBaixas] = useState([])
  const [visitas, setVisitas] = useState([])
  const [modal, setModal] = useState(null)
  const [showHist, setShowHist] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    const { data: eq } = await supabase
      .from('equipamentos')
      .select('*, contratos(*, clientes(*))')
      .eq('id', id)
      .single()

    setEquip(eq)
    setContrato(eq?.contratos)
    setCliente(eq?.contratos?.clientes)

    const pecaIds = (await supabase.from('pecas').select('id').eq('equipamento_id', id)).data?.map(p => p.id) || []

    const [{ data: ps }, { data: bs }, { data: vs }] = await Promise.all([
      supabase.from('pecas').select('*').eq('equipamento_id', id).order('descricao'),
      pecaIds.length > 0
        ? supabase.from('baixas').select('*').in('peca_id', pecaIds).order('data', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from('visitas').select('*').eq('contrato_id', eq?.contratos?.id).order('data', { ascending: false }),
    ])

    setPecas(ps || [])
    setBaixas(bs || [])
    setVisitas(vs || [])
  }

  // Tenta abrir baixa — bloqueia se não tiver visita registrada
  function tentarAbrirBaixa(peca) {
    if (visitas.length === 0) {
      setModal({ _action: 'semVisita' })
    } else {
      setModal({ peca, _action: 'baixa' })
    }
  }

  async function savePeca(form) {
    const { _action, id: _formId, created_at, updated_at, equipamento_id: _eqid, ...payload } = form
    if (modal?.id && modal?._action === 'editPeca') {
      await supabase.from('pecas').update({ ...payload, updated_at: new Date() }).eq('id', modal.id)
    } else {
      await supabase.from('pecas').insert({ ...payload, equipamento_id: id })
    }
    setModal(null)
    load()
  }

  async function excluirPeca(pid) {
    await supabase.from('pecas').delete().eq('id', pid)
    setModal(null)
    load()
  }

  async function saveBaixa(form) {
    const peca = modal?.peca
    await supabase.from('baixas').insert({ ...form, peca_id: peca.id })
    setModal(null)
    load()
  }

  async function gerarPDF(visitaId) {
    const visita = visitas.find(v => v.id === visitaId)
    // Baixas desta visita neste equipamento
    const baixasDaVisita = baixas.filter(b => b.visita_id === visitaId)

    if (baixasDaVisita.length === 0) {
      alert('Nenhuma baixa registrada para esta visita neste equipamento.')
      return
    }

    gerarPDFVisita({
      cliente,
      contrato,
      equipamento: equip,
      visita,
      baixas: baixasDaVisita,
      pecas,
      userEmail: user?.email,
    })

    setModal(null)
  }

  async function uploadFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `equipamentos/${id}/plaqueta.${ext}`
    const { error } = await supabase.storage.from('fotos').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('fotos').getPublicUrl(path)
      await supabase.from('equipamentos').update({ foto_url: publicUrl }).eq('id', id)
      load()
    }
    setUploading(false)
  }

  async function removerFoto() {
    await supabase.from('equipamentos').update({ foto_url: null }).eq('id', id)
    load()
  }

  if (!equip) return <div style={{ padding: 28, color: 'var(--text-2)' }}>Carregando...</div>

  const usado = (pid) => baixas.filter(b => b.peca_id === pid).reduce((s, b) => s + b.qtd, 0)
  const colSpan = contrato?.tipo === 'manutencao' ? 8 : 5

  return (
    <div style={{ minHeight: '100vh' }}>
      <Nav crumbs={[
        { label: 'Clientes', to: '/clientes' },
        { label: cliente?.razao_social, to: `/clientes/${cliente?.id}` },
        { label: `Contrato #${contrato?.numero}`, to: `/contratos/${contrato?.id}` },
        { label: `${equip.modelo}-${equip.serie}` }
      ]} />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 28px' }}>

        {/* Header com foto */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Badge tipo={contrato?.tipo} />
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{cliente?.razao_social}</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
              {equip.fabricante} {equip.modelo} · Série {equip.serie}
            </h1>
            <InfoGrid items={[
              ['Fabricante', equip.fabricante], ['Modelo', equip.modelo],
              ['Nº de Série', equip.serie], ['Ano', equip.ano],
              ['Part Number', equip.part_number], ['Localização', equip.localizacao],
            ]} />
          </div>

          {/* Foto da plaqueta */}
          <div style={{ width: 170, flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 6 }}>
              Foto da plaqueta
            </div>
            {equip.foto_url ? (
              <>
                <img src={equip.foto_url} onClick={() => setLightbox(equip.foto_url)}
                  style={{ width: 170, height: 120, borderRadius: 'var(--radius)', border: '1px solid var(--border)', objectFit: 'cover', cursor: 'pointer', display: 'block' }} />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button onClick={() => fileRef.current.click()} style={{ flex: 1, fontSize: 11, padding: '4px 0', borderRadius: 5, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer' }}>Trocar</button>
                  <button onClick={removerFoto} style={{ flex: 1, fontSize: 11, padding: '4px 0', borderRadius: 5, border: '1px solid var(--red-bg)', background: 'transparent', color: 'var(--red-text)', cursor: 'pointer' }}>Remover</button>
                </div>
              </>
            ) : (
              <div onClick={() => fileRef.current.click()}
                style={{ width: 170, height: 120, borderRadius: 'var(--radius)', border: '2px dashed var(--border-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: 'var(--bg-3)', transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-2)'}>
                <span style={{ fontSize: 24 }}>📷</span>
                <span style={{ fontSize: 11, color: 'var(--text-2)', textAlign: 'center' }}>
                  {uploading ? 'Enviando...' : 'Adicionar foto'}
                </span>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadFoto} />
          </div>
        </div>

        {/* Tabela de peças */}
        <Section
          title={`Peças do ${contrato?.tipo === 'manutencao' ? 'Contrato' : 'Equipamento'}`}
          action={<Btn size="sm" onClick={() => setModal('newPeca')}>+ Peça</Btn>}
        >
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Descrição', 'Código', 'Unid.',
                    ...(contrato?.tipo === 'manutencao' ? ['Contratado', 'Utilizado', 'Saldo'] : []),
                    'Obs.', ''
                  ].map(h => (
                    <th key={h} style={{
                      background: 'var(--bg-3)', color: 'var(--text-2)', fontSize: 10, fontWeight: 600,
                      letterSpacing: '.06em', textTransform: 'uppercase', padding: '8px 12px',
                      textAlign: ['Contratado', 'Utilizado', 'Saldo'].includes(h) ? 'center' : 'left',
                      borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pecas.map((p) => {
                  const u = usado(p.id)
                  const bxs = baixas.filter(b => b.peca_id === p.id)
                  const isOpen = showHist === p.id
                  return (
                    <React.Fragment key={p.id}>
                      <tr style={{ cursor: 'pointer' }}
                        onClick={() => setShowHist(isOpen ? null : p.id)}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ padding: '10px 12px', fontSize: 12, borderBottom: '1px solid var(--border)' }}>{p.descricao}</td>
                        <td style={{ padding: '10px 12px', fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{p.codigo}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{p.unidade}</td>
                        {contrato?.tipo === 'manutencao' && <>
                          <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'center', borderBottom: '1px solid var(--border)' }}>{p.qtd_contratada}</td>
                          <td style={{ padding: '10px 12px', fontSize: 12, textAlign: 'center', borderBottom: '1px solid var(--border)' }}>{u}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                            <SaldoBadge usado={u} total={p.qtd_contratada} />
                          </td>
                        </>}
                        <td style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{p.obs}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={e => { e.stopPropagation(); tentarAbrirBaixa(p) }}
                              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              + Baixa
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setModal({ ...p, _action: 'editPeca' }) }}
                              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer' }}>
                              ✎
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setModal({ ...p, _action: 'deletePeca' }) }}
                              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--red-bg)', background: 'transparent', color: 'var(--red-text)', cursor: 'pointer' }}>
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Histórico inline */}
                      {isOpen && (
                        <tr>
                          <td colSpan={colSpan} style={{ padding: 0, background: 'var(--bg)' }}>
                            <div style={{ padding: '10px 14px' }}>
                              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 8 }}>
                                Histórico de baixas
                              </div>
                              {bxs.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                                  <thead>
                                    <tr>
                                      {['Data', 'Nº OS', 'Qtd', 'RE / NF'].map(h => (
                                        <th key={h} style={{ background: 'var(--bg-3)', padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {bxs.map((b, bi) => (
                                      <tr key={b.id}>
                                        <td style={{ padding: '8px 10px', fontSize: 11, borderBottom: bi < bxs.length - 1 ? '1px solid var(--border)' : 'none' }}>{fmtDate(b.data)}</td>
                                        <td style={{ padding: '8px 10px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-2)', borderBottom: bi < bxs.length - 1 ? '1px solid var(--border)' : 'none' }}>{b.os}</td>
                                        <td style={{ padding: '8px 10px', fontSize: 11, textAlign: 'center', borderBottom: bi < bxs.length - 1 ? '1px solid var(--border)' : 'none' }}>{b.qtd}</td>
                                        <td style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-2)', borderBottom: bi < bxs.length - 1 ? '1px solid var(--border)' : 'none' }}>{b.re_nf || '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Nenhuma baixa registrada.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
                {pecas.length === 0 && (
                  <tr>
                    <td colSpan={colSpan} style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                      Nenhuma peça cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé da tabela */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <p style={{ fontSize: 10, color: 'var(--text-3)' }}>Clique em uma peça para ver o histórico de baixas.</p>
            {visitas.length > 0 && baixas.length > 0 && (
              <button
                onClick={() => setModal({ _action: 'gerarPDF' })}
                style={{ fontSize: 12, padding: '6px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--blue)', background: 'var(--blue-bg)', color: 'var(--blue-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                📄 Gerar PDF da visita
              </button>
            )}
          </div>
        </Section>
      </div>

      {/* ── Modais ── */}

      {/* Nova / editar peça */}
      {(modal === 'newPeca' || modal?._action === 'editPeca') && (
        <Modal title={modal === 'newPeca' ? 'Nova Peça' : 'Editar Peça'} onClose={() => setModal(null)} width={480}>
          <PecaForm initial={modal !== 'newPeca' ? modal : {}} tipo={contrato?.tipo} onSave={savePeca} onClose={() => setModal(null)} />
        </Modal>
      )}

      {/* Baixa de peça */}
      {modal?._action === 'baixa' && (
        <Modal title="Registrar Baixa" onClose={() => setModal(null)} width={440}>
          <BaixaForm peca={modal.peca} visitas={visitas} onSave={saveBaixa} onClose={() => setModal(null)} />
        </Modal>
      )}

      {/* Bloqueio: sem visita registrada */}
      {modal?._action === 'semVisita' && (
        <Modal title="Visita não registrada" onClose={() => setModal(null)} width={400}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
            Toda baixa de peça precisa estar vinculada a uma visita.
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
            Registre primeiro a visita (OS, data, horas e KM) na tela do contrato e volte aqui para dar baixa.
          </div>
          <BtnRow>
            <Btn variant="secondary" onClick={() => setModal(null)}>Fechar</Btn>
            <Btn onClick={() => navigate(`/contratos/${contrato?.id}`)}>
              Ir para o contrato →
            </Btn>
          </BtnRow>
        </Modal>
      )}

      {/* Gerar PDF */}
      {modal?._action === 'gerarPDF' && (
        <GerarPDFModal
          visitas={visitas}
          onGerar={gerarPDF}
          onClose={() => setModal(null)}
        />
      )}

      {/* Excluir peça */}
      {modal?._action === 'deletePeca' && (
        <Confirm
          danger
          message={`Excluir peça "${modal.descricao}"?`}
          onConfirm={() => excluirPeca(modal.id)}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Lightbox foto */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, cursor: 'pointer' }}>
          <img src={lightbox} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 'var(--radius-lg)', objectFit: 'contain' }} />
        </div>
      )}
    </div>
  )
}
