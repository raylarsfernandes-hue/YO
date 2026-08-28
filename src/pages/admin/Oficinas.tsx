import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import type { Workshop } from '../../types'

const empty: Omit<Workshop, 'id' | 'created_at'> = {
  name: '', teacher: '', teacher_photo_url: null, teacher_bio: null,
  event_day: '2026-10-24', start_time: '14:00',
  duration_minutes: 70, max_vagas: 150, active: true, order_index: 0,
}

export default function Oficinas() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [showNew, setShowNew] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('workshops').select('*').order('order_index')
    setWorkshops((data ?? []) as Workshop[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(w: Workshop) {
    setEditingId(w.id)
    setForm({
      name: w.name, teacher: w.teacher,
      teacher_photo_url: w.teacher_photo_url, teacher_bio: w.teacher_bio,
      event_day: w.event_day, start_time: w.start_time,
      duration_minutes: w.duration_minutes, max_vagas: w.max_vagas, active: w.active, order_index: w.order_index,
    })
    setShowNew(false)
  }

  function startNew() {
    setEditingId(null)
    setForm(empty)
    setShowNew(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.teacher.trim()) {
      alert('Preencha nome e professor(a).')
      return
    }
    if (editingId) {
      await supabase.from('workshops').update(form).eq('id', editingId)
    } else {
      await supabase.from('workshops').insert(form)
    }
    setEditingId(null)
    setShowNew(false)
    load()
  }

  async function toggleActive(w: Workshop) {
    await supabase.from('workshops').update({ active: !w.active }).eq('id', w.id)
    load()
  }

  function cancelEdit() {
    setEditingId(null)
    setShowNew(false)
  }

  const editing = editingId !== null || showNew

  return (
    <div>
      <h2>Oficinas</h2>
      <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 20 }}>
        Edite nome, professor(a), foto, biografia, data, horário e número de vagas.
        Alterações refletem imediatamente no site.
      </p>

      {!editing && <button className="btn-sm ok" onClick={startNew}>+ Nova oficina</button>}

      {editing && (
        <div className="card" style={{ marginTop: 16, maxWidth: 520 }}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>{editingId ? 'Editar oficina' : 'Nova oficina'}</h3>

          <div className="field">
            <label>Nome da oficina (modalidade)</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Professor(a)</label>
            <input type="text" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
          </div>
          <div className="field">
            <label>URL da foto do professor (opcional)</label>
            <input
              type="text"
              value={form.teacher_photo_url ?? ''}
              onChange={(e) => setForm({ ...form, teacher_photo_url: e.target.value || null })}
              placeholder="https://..."
            />
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
              Pode colar o link normal de compartilhamento do Google Drive (o site converte
              automaticamente). Lembre de deixar o arquivo com acesso "Qualquer pessoa com o link".
            </p>
          </div>
          <div className="field">
            <label>Biografia / release do professor (opcional)</label>
            <textarea
              value={form.teacher_bio ?? ''}
              onChange={(e) => setForm({ ...form, teacher_bio: e.target.value || null })}
              rows={4}
              style={{ width: '100%', padding: '12px 14px', background: 'var(--preto)', border: '1px solid var(--borda)', borderRadius: 4, color: 'var(--branco)', fontSize: 14, fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Data</label>
              <input type="date" value={form.event_day} onChange={(e) => setForm({ ...form, event_day: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Horário</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Duração (min)</label>
              <input type="text" inputMode="numeric" value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) || 0 })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Vagas máximas</label>
              <input type="text" inputMode="numeric" value={form.max_vagas}
                onChange={(e) => setForm({ ...form, max_vagas: Number(e.target.value) || 0 })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Ordem</label>
              <input type="text" inputMode="numeric" value={form.order_index}
                onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="checkbox-field">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span>Inscrições ativas para esta oficina</span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="submit-btn" style={{ flex: 1 }} onClick={handleSave}>Salvar</button>
            <button className="btn-secondary" onClick={cancelEdit}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? <p style={{ marginTop: 20 }}>Carregando...</p> : (
        <div className="table-wrap" style={{ marginTop: 24 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th><th>Professor(a)</th><th>Data</th><th>Horário</th>
                <th>Vagas</th><th>Ativa</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {workshops.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.teacher}</td>
                  <td>{w.event_day}</td>
                  <td>{w.start_time}</td>
                  <td>{w.max_vagas}</td>
                  <td>{w.active ? 'Sim' : 'Não'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-sm" onClick={() => startEdit(w)}>Editar</button>
                    <button className="btn-sm" onClick={() => toggleActive(w)}>
                      {w.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
