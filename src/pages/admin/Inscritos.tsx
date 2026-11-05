import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useEventSettings } from '../../hooks/useEventSettings'
import type { RegistrationRow, GuardianStatus } from '../../types'
import { downloadCSV } from '../../utils/csv'
import { formatDayLong, computeAge, guardianStatusLabel, formatParticipation } from '../../utils/format'

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  waitlisted: 'Lista de espera',
  cancelled: 'Cancelada',
}

type DayFilter = '' | 'd1' | 'd2' | 'both'

interface Person {
  cpf: string
  name: string
  phone: string
  email: string
  instagram: string | null
  birth_date: string | null
  guardian: GuardianStatus
  image_consent: boolean
  consent_marketing: boolean
  created_at: string
  rows: RegistrationRow[] // uma por dia
}

export default function Inscritos() {
  const { settings } = useEventSettings()
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterDay, setFilterDay] = useState<DayFilter>('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMinors, setFilterMinors] = useState(false)

  const day1 = settings.event_start_date
  const day2 = settings.event_end_date
  const label1 = formatParticipation([day1])
  const label2 = formatParticipation([day2])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('registrations').select('*').order('created_at', { ascending: false })
    setRegistrations((data ?? []) as RegistrationRow[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const people: Person[] = useMemo(() => {
    const map = new Map<string, Person>()
    registrations.forEach((r) => {
      let p = map.get(r.cpf)
      if (!p) {
        p = {
          cpf: r.cpf, name: r.full_name, phone: r.phone, email: r.email,
          instagram: r.instagram, birth_date: r.birth_date,
          guardian: r.guardian_authorization_status, image_consent: r.image_consent,
          consent_marketing: r.consent_marketing, created_at: r.created_at, rows: [],
        }
        map.set(r.cpf, p)
      }
      p.rows.push(r)
      if (r.created_at < p.created_at) p.created_at = r.created_at
    })
    map.forEach((p) => p.rows.sort((a, b) => a.event_day.localeCompare(b.event_day)))
    return Array.from(map.values())
  }, [registrations])

  function ageOf(p: Person): number | null {
    return p.birth_date ? computeAge(p.birth_date, settings.event_start_date) : null
  }
  function isMinor(p: Person): boolean {
    const a = ageOf(p)
    return a !== null && a < 18
  }
  function activeDays(p: Person): string[] {
    return p.rows.filter((r) => r.status !== 'cancelled').map((r) => r.event_day)
  }
  function personStatus(p: Person): string {
    if (p.rows.some((r) => r.status === 'confirmed')) return 'confirmed'
    if (p.rows.some((r) => r.status === 'waitlisted')) return 'waitlisted'
    return 'cancelled'
  }
  function participationLabel(p: Person): string {
    const days = activeDays(p)
    return days.length > 0 ? formatParticipation(days) : 'Cancelada'
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return people.filter((p) => {
      const days = activeDays(p)
      if (filterDay === 'd1' && !days.includes(day1)) return false
      if (filterDay === 'd2' && !days.includes(day2)) return false
      if (filterDay === 'both' && !(days.includes(day1) && days.includes(day2))) return false
      if (filterStatus && !p.rows.some((r) => r.status === filterStatus)) return false
      if (filterMinors && !isMinor(p)) return false
      if (term && !`${p.name} ${p.cpf} ${p.email} ${p.phone}`.toLowerCase().includes(term)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, search, filterDay, filterStatus, filterMinors, day1, day2])

  async function rpc(name: string, args: Record<string, unknown>, errorMsg?: string) {
    const { error } = await supabase.rpc(name, args)
    if (error && errorMsg) alert(errorMsg)
    load()
  }

  function handleCancel(id: string) {
    if (!confirm('Cancelar a inscrição deste dia? A vaga será liberada automaticamente.')) return
    rpc('admin_cancel_registration', { p_id: id })
  }
  function handleReactivate(id: string) {
    rpc('admin_reactivate_registration', { p_id: id }, 'Não foi possível reativar: o dia pode estar esgotado ou a pessoa já tem outra inscrição ativa nele.')
  }
  function handlePromote(id: string) {
    rpc('admin_promote_waitlist', { p_id: id }, 'Não foi possível promover: o dia já está com todas as vagas ocupadas.')
  }
  function handleCheckin(id: string, checked: boolean) {
    rpc('admin_set_checkin', { p_id: id, p_checked: checked })
  }
  async function handleGuardianStatus(cpf: string, status: GuardianStatus) {
    await supabase.from('registrations').update({ guardian_authorization_status: status }).eq('cpf', cpf)
    load()
  }

  function toCSVRows(list: Person[]) {
    return list.map((p) => {
      const age = ageOf(p)
      const r1 = p.rows.find((r) => r.event_day === day1 && r.status !== 'cancelled')
      const r2 = p.rows.find((r) => r.event_day === day2 && r.status !== 'cancelled')
      return {
        Nome: p.name,
        CPF: p.cpf,
        Telefone: p.phone,
        Email: p.email,
        Instagram: p.instagram ?? '',
        DataNascimento: p.birth_date ?? '',
        Idade: age ?? '',
        MenorDeIdade: age !== null && age < 18 ? 'Sim' : 'Não',
        [`Dia ${label1}`]: r1 ? 'Sim' : 'Não',
        [`Dia ${label2}`]: r2 ? 'Sim' : 'Não',
        Participacao: participationLabel(p),
        Codigos: p.rows.filter((r) => r.status !== 'cancelled').map((r) => r.code).join(' / '),
        AutorizacaoImagem: p.image_consent ? 'Sim' : 'Não',
        AutorizacaoResponsavel: guardianStatusLabel(p.guardian),
        AceitaComunicacao: p.consent_marketing ? 'Sim' : 'Não',
        [`CheckIn ${label1}`]: r1 ? (r1.checked_in ? 'Compareceu' : 'Não compareceu') : '',
        [`CheckIn ${label2}`]: r2 ? (r2.checked_in ? 'Compareceu' : 'Não compareceu') : '',
        InscritoEm: new Date(p.created_at).toLocaleString('pt-BR'),
        Status: STATUS_LABEL[personStatus(p)],
      }
    })
  }

  function exportList(name: string, list: Person[]) {
    downloadCSV(name, toCSVRows(list))
  }

  function exportDay(day: string, label: string) {
    const list = people.filter((p) => activeDays(p).includes(day))
    exportList(`inscritos-${label.replace('/', '-')}.csv`, list)
  }

  if (loading) return <p>Carregando inscritos...</p>

  const ativos = people.filter((p) => activeDays(p).length > 0).length

  return (
    <div>
      <h2>Inscritos</h2>
      <p style={{ opacity: 0.6, fontSize: 14 }}>
        {ativos} inscritos ativos · mostrando {filtered.length} de {people.length} pessoas com os filtros atuais
      </p>

      <div className="toolbar">
        <input
          placeholder="Buscar por nome, CPF, e-mail ou telefone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <select value={filterDay} onChange={(e) => setFilterDay(e.target.value as DayFilter)}>
          <option value="">Todos os dias</option>
          <option value="d1">{label1}</option>
          <option value="d2">{label2}</option>
          <option value="both">Dois dias</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="confirmed">Confirmada</option>
          <option value="waitlisted">Lista de espera</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={filterMinors} onChange={(e) => setFilterMinors(e.target.checked)} />
          Só menores de idade
        </label>
      </div>

      <div className="toolbar">
        <button className="btn-sm ok" onClick={() => exportList('inscritos-todos.csv', people)}>Exportar todos (CSV)</button>
        <button className="btn-sm" onClick={() => exportDay(day1, label1)}>Exportar só {label1}</button>
        <button className="btn-sm" onClick={() => exportDay(day2, label2)}>Exportar só {label2}</button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Participante</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Idade</th>
              <th>Autorização resp.</th>
              <th>Participação</th>
              <th>Por dia</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const age = ageOf(p)
              const minor = isMinor(p)
              return (
                <tr key={p.cpf}>
                  <td>
                    {p.name}
                    <div style={{ fontSize: 11, opacity: 0.55 }}>{p.email}</div>
                  </td>
                  <td>{p.cpf}</td>
                  <td>{p.phone}</td>
                  <td>{age ?? '—'}{minor && <span className="badge ultimas" style={{ marginLeft: 6 }}>Menor</span>}</td>
                  <td>
                    {minor ? (
                      <select
                        value={p.guardian}
                        onChange={(e) => handleGuardianStatus(p.cpf, e.target.value as GuardianStatus)}
                        style={{ background: 'var(--preto)', color: 'var(--branco)', border: '1px solid var(--borda)', borderRadius: 4, fontSize: 12, padding: '4px 6px' }}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="confirmada">Confirmada</option>
                      </select>
                    ) : (
                      <span style={{ opacity: 0.5, fontSize: 12 }}>Não necessária</span>
                    )}
                  </td>
                  <td><strong>{participationLabel(p)}</strong></td>
                  <td>
                    {p.rows.map((r) => (
                      <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '4px 0' }}>
                        <span style={{ minWidth: 110 }}>{formatDayLong(r.event_day)}</span>
                        <span className={`status-tag ${r.status}`}>{STATUS_LABEL[r.status]}</span>
                        <span style={{ fontSize: 11, opacity: 0.5 }}>{r.code}</span>
                        <label style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 12 }}>
                          <input
                            type="checkbox"
                            checked={r.checked_in}
                            onChange={(e) => handleCheckin(r.id, e.target.checked)}
                            disabled={r.status !== 'confirmed'}
                          />
                          check-in
                        </label>
                        {r.status === 'confirmed' && (
                          <button className="btn-sm danger" onClick={() => handleCancel(r.id)}>Cancelar</button>
                        )}
                        {r.status === 'waitlisted' && (
                          <>
                            <button className="btn-sm ok" onClick={() => handlePromote(r.id)}>Promover</button>
                            <button className="btn-sm danger" onClick={() => handleCancel(r.id)}>Cancelar</button>
                          </>
                        )}
                        {r.status === 'cancelled' && (
                          <button className="btn-sm ok" onClick={() => handleReactivate(r.id)}>Reativar</button>
                        )}
                      </div>
                    ))}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', opacity: 0.6, padding: 20 }}>Nenhuma inscrição encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
