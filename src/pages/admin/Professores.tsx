import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import type { Teacher } from '../../types'

type Form = Omit<Teacher, 'id'>
const blank: Form = { name: '', modality: '', photo_url: null, bio: null, order_index: 0, active: true }

export default function AdminProfessores() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<Form>(blank)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('teachers').select('*').order('order_index')
    setTeachers((data ?? []) as Teacher[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(t: Teacher) {
    setEditingId(t.id)
    setShowNew(false)
    setForm({ name: t.name, modality: t.modality, photo_url: t.photo_url, bio: t.bio, order_index: t.order_index, active: t.active })
  }

  function startNew() {
    setEditingId(null)
    setShowNew(true)
    setForm({ ...blank, order_index: teachers.length + 1 })
  }

  async function handleSave() {
    if (!form.name.trim()) {
      alert('Informe o nome do professor.')
      return
    }
    const payload = { ...form, modality: form.modality?.trim() || null }
    const { error } = editingId
      ? await supabase.from('teachers').update(payload).eq('id', editingId)
      : await supabase.from('teachers').insert(payload)
    if (error) {
      alert('Não foi possível salvar: ' + error.message)
      return
    }
    setEditingId(null)
    setShowNew(false)
    load()
  }

  async function toggleActive(t: Teacher) {
    await supabase.from('teachers').update({ active: !t.active }).eq('id', t.id)
    load()
  }

  const editing = editingId !== null || showNew

  return (
    <div>
      <h2>Professores</h2>
      <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 20 }}>
        Professores que aparecem na seção Professores da home. O site mostra só a foto e o nome.
        Modalidade e release ficam guardados aqui para uso interno e não aparecem no site.
      </p>

      {!editing && <button className="btn-sm ok" onClick={startNew}>+ Novo professor</button>}

      {editing && (
        <div className="card" style={{ marginTop: 16, maxWidth: 520 }}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>{editingId ? 'Editar professor' : 'Novo professor'}</h3>

          <div className="field">
            <label>Nome</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Modalidade / área</label>
            <input type="text" value={form.modality ?? ''} onChange={(e) => setForm({ ...form, modality: e.target.value })} placeholder="Ex.: Popping" />
          </div>
          <div className="field">
            <label>URL da foto (opcional)</label>
            <input
              type="text"
              value={form.photo_url ?? ''}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value || null })}
              placeholder="https://..."
            />
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
              Pode colar o link de compartilhamento do Google Drive (o site converte sozinho).
              O arquivo precisa estar com acesso "Qualquer pessoa com o link".
            </p>
          </div>
          <div className="field">
            <label>Apresentação / release (opcional)</label>
            <textarea
              value={form.bio ?? ''}
              onChange={(e) => setForm({ ...form, bio: e.target.value || null })}
              rows={5}
              style={{ width: '100%', padding: '12px 14px', background: 'var(--preto)', border: '1px solid var(--borda)', borderRadius: 4, color: 'var(--branco)', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>
          <div className="field">
            <label>Ordem na página</label>
            <input type="text" inputMode="numeric" value={form.order_index}
              onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) || 0 })} />
          </div>
          <div className="checkbox-field">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span>Mostrar no site</span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="submit-btn" style={{ flex: 1 }} onClick={handleSave}>Salvar</button>
            <button className="btn-secondary" onClick={() => { setEditingId(null); setShowNew(false) }}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ marginTop: 20 }}>Carregando...</p> : (
        <div className="table-wrap" style={{ marginTop: 24 }}>
          <table className="data-table">
            <thead>
              <tr><th>Ordem</th><th>Nome</th><th>Modalidade</th><th>Foto</th><th>Release</th><th>No site</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td>{t.order_index}</td>
                  <td>{t.name}</td>
                  <td>{t.modality ?? '—'}</td>
                  <td>{t.photo_url ? 'Sim' : 'Não'}</td>
                  <td>{t.bio ? 'Sim' : 'Não'}</td>
                  <td>{t.active ? 'Sim' : 'Não'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-sm" onClick={() => startEdit(t)}>Editar</button>
                    <button className="btn-sm" onClick={() => toggleActive(t)}>{t.active ? 'Ocultar' : 'Mostrar'}</button>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', opacity: 0.6, padding: 20 }}>Nenhum professor cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
