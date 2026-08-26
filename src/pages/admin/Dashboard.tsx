import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import type { WorkshopPublic, RegistrationRow } from '../../types'
import { formatDayLong, statusLabel } from '../../utils/format'

export default function Dashboard() {
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [{ data: w }, { data: r }] = await Promise.all([
      supabase.from('workshops_public').select('*').order('order_index'),
      supabase.from('registrations').select('*').order('created_at', { ascending: false }),
    ])
    setWorkshops((w ?? []) as WorkshopPublic[])
    setRegistrations((r ?? []) as RegistrationRow[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const confirmed = registrations.filter((r) => r.status === 'confirmed')
  const totalInscricoes = confirmed.length
  const pessoasUnicas = new Set(confirmed.map((r) => r.cpf)).size
  const totalVagas = workshops.reduce((acc, w) => acc + w.max_vagas, 0)
  const vagasPreenchidas = workshops.reduce((acc, w) => acc + w.taken, 0)
  const ocupacao = totalVagas > 0 ? Math.round((vagasPreenchidas / totalVagas) * 100) : 0

  const ranking = [...workshops].sort((a, b) => b.taken - a.taken)
  const maisProcurada = ranking[0]
  const menosProcurada = ranking[ranking.length - 1]

  const porDia: Record<string, number> = {}
  confirmed.forEach((r) => {
    const w = workshops.find((w) => w.id === r.workshop_id)
    if (w) porDia[w.event_day] = (porDia[w.event_day] ?? 0) + 1
  })

  const recentes = registrations.slice(0, 6)

  if (loading) return <p>Carregando indicadores...</p>

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>Sumaré Hip Hop Festival — Inscrições</h2>
      <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 20 }}>Visão geral atualizada em tempo real.</p>

      <div className="grid-4">
        <div className="card accent">
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--amarelo)', fontFamily: 'Oswald' }}>{totalInscricoes}</div>
          <div style={{ fontSize: 12, opacity: 0.6, textTransform: 'uppercase' }}>Total de inscrições</div>
        </div>
        <div className="card accent">
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--amarelo)', fontFamily: 'Oswald' }}>{pessoasUnicas}</div>
          <div style={{ fontSize: 12, opacity: 0.6, textTransform: 'uppercase' }}>Pessoas únicas</div>
        </div>
        <div className="card accent">
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--amarelo)', fontFamily: 'Oswald' }}>{vagasPreenchidas}/{totalVagas}</div>
          <div style={{ fontSize: 12, opacity: 0.6, textTransform: 'uppercase' }}>Vagas ocupadas</div>
        </div>
        <div className="card accent">
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--amarelo)', fontFamily: 'Oswald' }}>{ocupacao}%</div>
          <div style={{ fontSize: 12, opacity: 0.6, textTransform: 'uppercase' }}>Ocupação geral</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <div className="card accent">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Oficinas mais procuradas</h3>
          {ranking.map((w, i) => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '1px solid var(--borda)' }}>
              <span>{i + 1}. {w.name} — {w.teacher}</span>
              <strong>{w.taken} inscritos</strong>
            </div>
          ))}
          {maisProcurada && (
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
              Mais procurada: <strong>{maisProcurada.name}</strong> · Menos procurada: <strong>{menosProcurada.name}</strong>
            </p>
          )}
        </div>

        <div className="card accent">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Inscrições por dia</h3>
          {Object.entries(porDia).sort().map(([dia, count]) => (
            <div key={dia} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '1px solid var(--borda)' }}>
              <span>{formatDayLong(dia)}</span>
              <strong>{count}</strong>
            </div>
          ))}

          <h3 style={{ fontSize: 15, margin: '18px 0 12px' }}>Inscrições recentes</h3>
          {recentes.map((r) => (
            <div key={r.id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
              {r.full_name} <span style={{ opacity: 0.5 }}>· {r.code}</span>
            </div>
          ))}
        </div>
      </div>

      <h3 style={{ fontSize: 16, margin: '28px 0 14px' }}>Ocupação por oficina</h3>
      <div className="workshops-grid" style={{ marginTop: 0 }}>
        {workshops.map((w) => {
          const pct = Math.round((w.taken / Math.max(w.max_vagas, 1)) * 100)
          return (
            <div key={w.id} className="card accent">
              <div style={{ fontSize: 12, opacity: 0.6, textTransform: 'uppercase' }}>{formatDayLong(w.event_day)} · {w.start_time}</div>
              <div style={{ fontSize: 18, fontWeight: 700, margin: '4px 0' }}>{w.name} — {w.teacher}</div>
              <div className="progress-bar" style={{ margin: '10px 0' }}><div style={{ width: `${pct}%` }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{w.taken} / {w.max_vagas} vagas · {pct}% ocupado</span>
                <span className={`badge ${w.status}`}>{statusLabel(w.status)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
