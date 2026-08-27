import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import type { EventSettings } from '../../types'

export default function Configuracoes() {
  const [form, setForm] = useState<EventSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('event_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      setForm(data as EventSettings)
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    if (!form) return
    setSaving(true)
    setSaved(false)
    await supabase.from('event_settings').update(form).eq('id', true)
    setSaving(false)
    setSaved(true)
  }

  if (loading || !form) return <p>Carregando configurações...</p>

  return (
    <div>
      <h2>Configurações do evento</h2>
      <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 20 }}>
        Local, datas e o link do PDF de autorização de menores ficam centralizados aqui — mudar
        aqui reflete automaticamente no site, no formulário e na tela de confirmação.
      </p>

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="field">
          <label>Nome do local</label>
          <input type="text" value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} />
        </div>
        <div className="field">
          <label>Endereço / cidade</label>
          <input type="text" value={form.location_address} onChange={(e) => setForm({ ...form, location_address: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Data de início do evento</label>
            <input type="date" value={form.event_start_date} onChange={(e) => setForm({ ...form, event_start_date: e.target.value })} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Data de término do evento</label>
            <input type="date" value={form.event_end_date} onChange={(e) => setForm({ ...form, event_end_date: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Link do PDF de autorização (menores de idade)</label>
          <input
            type="text"
            value={form.guardian_authorization_pdf_url ?? ''}
            onChange={(e) => setForm({ ...form, guardian_authorization_pdf_url: e.target.value || null })}
            placeholder="https://..."
          />
        </div>
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: -8, marginBottom: 16 }}>
          A idade dos participantes é calculada com base na "Data de início do evento" — não na
          data em que a pessoa se inscreve.
        </p>

        <button className="submit-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
        {saved && <p style={{ color: 'var(--amarelo)', fontSize: 13, marginTop: 10 }}>Salvo com sucesso.</p>}
      </div>
    </div>
  )
}
