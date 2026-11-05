import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useEventSettings } from '../../hooks/useEventSettings'
import type { Workshop } from '../../types'
import { formatDayLong, formatTimeRange } from '../../utils/format'

type Form = Omit<Workshop, 'id' | 'created_at'>

export default function AdminProgramacao() {
  const { settings } = useEventSettings()
  const [items, setItems] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<Form>({
    name: '', event_day: settings.event_start_date, start_time: '14:00',
    duration_minutes: 70, active: true, order_index: 0,
  })

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('workshops')
      .select('id, name, event_day, start_time, duration_minutes, active, order_index, created_at')
      .order('event_day')
      .order('start_time')
    setItems((data ?? []) as Workshop[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function blank(): Form {
    return {
      name: '', event_day: settings.event_start_date, start_time: '14:00',
      duration_minutes: 70, active: true, order_index: items.length + 1,
    }
  }

  function startEdit(w: Workshop) {
    setEditingId(w.id)
    setShowNew(false)
    setForm({
      name: w.name, event_day: w.event_day, start_time: w.start_time,
      duration_minutes: w.duration_minutes, active: w.active, order_index: w.order_index,
    })
  }

  function startNew() {
    setEditingId(null)
    setForm(blank())
    setShowNew(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      alert('Informe o nome da aula ou modalidade.')
      return
    }
    const { error } = editingId
      ? await supabase.from('workshops').update(form).eq('id', editingId)
      : await supabase.from('workshops').insert(form)
    if (error) {
      alert('Não foi possível salvar: ' + error.message)
      return
    }
    setEditingId(null)
    setShowNew(false)
    load()
  }

  async function toggleActive(w: Workshop) {
    await supabase.from('workshops').update({ active: !w.active }).eq('id', w.id)
    load()
  }

  const editing = editingId !== null || showNew

  return (
    <div>
      <h2>Programação</h2>
      <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 20 }}>
        Aulas e horários que aparecem na página Programação e na Home. A programação não mostra
        o nome dos professores. Para editar os professores, use a aba Professores.
      </p>

      {!editing && <button className="btn-sm ok" onClick={startNew}>+ Nova aula</button>}

      {editing && (
        <div className="card" style={{ marginTop: 16, maxWidth: 520 }}>
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>{editingId ? 'Editar aula' : 'Nova aula'}</h3>

          <div className="field">
            <label>Aula / modalidade</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Hip Hop" />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Dia</label>
              <select
                value={form.event_day}
                onChange={(e) => setForm({ ...form, event_day: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', background: 'var(--preto)', border: '1px solid var(--borda)', borderRadius: 4, color: 'var(--branco)', fontSize: 14 }}
              >
                {[settings.event_start_date, settings.event_end_date]
                  .filter((d, i, arr) => arr.indexOf(d) === i)
                  .map((d) => <option key={d} value={d}>{formatDayLong(d)}</option>)}
                {![settings.event_start_date, settings.event_end_date].includes(form.event_day) && (
                  <option value={form.event_day}>{form.event_day} (fora das datas do evento)</option>
                )}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Horário de início</label>
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
              <label>Ordem</label>
              <input type="text" inputMode="numeric" value={form.order_index}
                onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="checkbox-field">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span>Mostrar na programação do site</span>
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
              <tr><th>Dia</th><th>Aula</th><th>Horário</th><th>No site</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id}>
                  <td>{formatDayLong(w.event_day)}</td>
                  <td>{w.name}</td>
                  <td>{formatTimeRange(w.start_time, w.duration_minutes)}</td>
                  <td>{w.active ? 'Sim' : 'Não'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-sm" onClick={() => startEdit(w)}>Editar</button>
                    <button className="btn-sm" onClick={() => toggleActive(w)}>{w.active ? 'Ocultar' : 'Mostrar'}</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', opacity: 0.6, padding: 20 }}>Nenhuma aula cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
