import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useEventSettings } from '../../hooks/useEventSettings'
import type { DayPublic, RegistrationRow } from '../../types'
import { formatDayLong, statusLabel, computeAge, formatParticipation } from '../../utils/format'

const bigNumber = { fontSize: 32, fontWeight: 700, color: 'var(--amarelo)', fontFamily: 'Oswald' } as const
const smallLabel = { fontSize: 12, opacity: 0.6, textTransform: 'uppercase' } as const

export default function Dashboard() {
  const { settings } = useEventSettings()
  const [days, setDays] = useState<DayPublic[]>([])
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [{ data: d }, { data: r }] = await Promise.all([
      supabase.from('days_public').select('*').order('event_day'),
      supabase.from('registrations').select('*').order('created_at', { ascending: false }),
    ])
    setDays((d ?? []) as DayPublic[])
    setRegistrations((r ?? []) as RegistrationRow[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const confirmed = registrations.filter((r) => r.status === 'confirmed')
  const waitlisted = registrations.filter((r) => r.status === 'waitlisted')

  // dias de cada pessoa (por CPF), só inscrições confirmadas
  const diasPorCpf = new Map<string, Set<string>>()
  confirmed.forEach((r) => {
    if (!diasPorCpf.has(r.cpf)) diasPorCpf.set(r.cpf, new Set())
    diasPorCpf.get(r.cpf)!.add(r.event_day)
  })
  const totalInscritos = diasPorCpf.size
  const dia1 = days[0]
  const dia2 = days[1]
  const doisDias = days.length >= 2
    ? Array.from(diasPorCpf.values()).filter((s) => s.has(days[0].event_day) && s.has(days[1].event_day)).length
    : 0

  const menores = confirmed.filter((r) => r.birth_date && computeAge(r.birth_date, settings.event_start_date) < 18)
  const menoresPessoas = new Set(menores.map((r) => r.cpf)).size
  const autorizacoesPendentes = new Set(
    menores.filter((r) => r.guardian_authorization_status === 'pendente').map((r) => r.cpf)
  ).size

  const recentes = registrations.slice(0, 6)

  if (loading) return <p>Carregando indicadores...</p>

  return (
    <div>
      <h2 style={{ marginBottom: 6 }}>Encontro de Danças Urbanas de Sumaré — Inscrições</h2>
      <p style={{ opacity: 0.6, fontSize: 14, marginBottom: 20 }}>Visão geral atualizada em tempo real.</p>

      <div className="grid-4">
        <div className="card">
          <div style={bigNumber}>{totalInscritos}</div>
          <div style={smallLabel}>Total de inscritos</div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>pessoas, contadas uma vez só</div>
        </div>
        {dia1 && (
          <div className="card">
            <div style={bigNumber}>{dia1.taken}</div>
            <div style={smallLabel}>Inscritos {formatDayLong(dia1.event_day)}</div>
          </div>
        )}
        {dia2 && (
          <div className="card">
            <div style={bigNumber}>{dia2.taken}</div>
            <div style={smallLabel}>Inscritos {formatDayLong(dia2.event_day)}</div>
          </div>
        )}
        <div className="card">
          <div style={bigNumber}>{doisDias}</div>
          <div style={smallLabel}>Inscritos nos dois dias</div>
        </div>
        <div className="card">
          <div style={{ ...bigNumber, color: 'var(--vermelho)' }}>{menoresPessoas}</div>
          <div style={smallLabel}>Menores de idade</div>
        </div>
        <div className="card">
          <div style={{ ...bigNumber, color: 'var(--vermelho)' }}>{autorizacoesPendentes}</div>
          <div style={smallLabel}>Autorizações pendentes</div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>menores com autorização do responsável pendente</div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, margin: '28px 0 14px' }}>Vagas por dia</h3>
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {days.map((d) => {
          const pct = Math.round((d.taken / Math.max(d.max_vagas, 1)) * 100)
          return (
            <div key={d.event_day} className="card">
              <div style={smallLabel}>{formatDayLong(d.event_day)}</div>
              <div style={{ fontSize: 22, fontWeight: 700, margin: '4px 0' }}>
                {d.taken} / {d.max_vagas} inscritos
              </div>
              <div className="progress-bar" style={{ margin: '10px 0' }}><div style={{ width: `${Math.min(pct, 100)}%` }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{d.vagas_restantes} vagas restantes · ocupação {pct}%</span>
                <span className={`badge ${d.status === 'esgotado' ? 'esgotada' : d.status}`}>{statusLabel(d.status)}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 12 }}>Inscrições recentes</h3>
        {recentes.map((r) => (
          <div key={r.id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
            {r.full_name} <span style={{ opacity: 0.5 }}>· {formatParticipation([r.event_day])} · {r.code}</span>
          </div>
        ))}
        {recentes.length === 0 && <p style={{ fontSize: 13, opacity: 0.6 }}>Nenhuma inscrição ainda.</p>}
        {waitlisted.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--vermelho)', marginTop: 12 }}>
            {waitlisted.length} inscrição(ões) antiga(s) em lista de espera (do formato por oficina).
          </p>
        )}
      </div>
    </div>
  )
}
