import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { useEventSettings } from '../../hooks/useEventSettings'
import type { RegistrationRow, Workshop, GuardianStatus } from '../../types'
import { downloadCSV } from '../../utils/csv'
import { formatDayLong, computeAge, guardianStatusLabel } from '../../utils/format'

export default function Inscritos() {
  const { settings } = useEventSettings()
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterWorkshop, setFilterWorkshop] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMinors, setFilterMinors] = useState(false)

  async function load() {
    setLoading(true)
    const [{ data: r }, { data: w }] = await Promise.all([
      supabase
        .from('registrations')
        .select('*, workshops(name, teacher, event_day, start_time)')
        .order('created_at', { ascending: false }),
      supabase.from('workshops').select('*').order('order_index'),
    ])
    setRegistrations((r ?? []) as RegistrationRow[])
    setWorkshops((w ?? []) as Workshop[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function ageOf(r: RegistrationRow): number | null {
    if (!r.birth_date) return null
    return computeAge(r.birth_date, settings.event_start_date)
  }

  function isMinor(r: RegistrationRow): boolean {
    const age = ageOf(r)
    return age !== null && age < 18
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return registrations.filter((r) => {
      if (filterWorkshop && r.workshop_id !== filterWorkshop) return false
      if (filterStatus && r.status !== filterStatus) return false
      if (filterMinors && !isMinor(r)) return false
      if (term) {
        const haystack = `${r.full_name} ${r.cpf} ${r.email} ${r.phone}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrations, search, filterWorkshop, filterStatus, filterMinors, settings.event_start_date])

  async function handleCancel(id: string) {
    if (!confirm('Cancelar esta inscrição? A vaga será liberada automaticamente.')) return
    await supabase.rpc('admin_cancel_registration', { p_id: id })
    load()
  }

  async function handleReactivate(id: string) {
    const { error } = await supabase.rpc('admin_reactivate_registration', { p_id: id })
    if (error) {
      alert('Não foi possível reativar: a oficina pode estar esgotada.')
    }
    load()
  }

  async function handleCheckin(id: string, checked: boolean) {
    await supabase.rpc('admin_set_checkin', { p_id: id, p_checked: checked })
    load()
  }

  async function handleGuardianStatus(id: string, status: GuardianStatus) {
    await supabase.from('registrations').update({ guardian_authorization_status: status }).eq('id', id)
    load()
  }

  function exportAll() {
    downloadCSV('inscricoes-sumare-hiphop.csv', toCSVRows(filtered))
  }

  function exportWorkshop(workshopId: string) {
    const rows = registrations.filter((r) => r.workshop_id === workshopId)
    const w = workshops.find((w) => w.id === workshopId)
    downloadCSV(`inscritos-${w?.name ?? 'oficina'}-${w?.teacher ?? ''}.csv`.replace(/\s+/g, '-'), toCSVRows(rows))
  }

  function toCSVRows(rows: RegistrationRow[]) {
    return rows.map((r) => {
      const age = ageOf(r)
      return {
        Codigo: r.code,
        Nome: r.full_name,
        CPF: r.cpf,
        Telefone: r.phone,
        Email: r.email,
        Instagram: r.instagram ?? '',
        DataNascimento: r.birth_date ?? '',
        IdadeNoEvento: age ?? '',
        MenorDeIdade: age !== null && age < 18 ? 'Sim' : 'Não',
        AutorizacaoResponsavel: guardianStatusLabel(r.guardian_authorization_status),
        AutorizacaoImagem: r.image_consent ? 'Sim' : 'Não',
        Oficina: r.workshops?.name ?? '',
        Professor: r.workshops?.teacher ?? '',
        Dia: r.workshops ? formatDayLong(r.workshops.event_day) : '',
        Horario: r.workshops?.start_time ?? '',
        InscritoEm: new Date(r.created_at).toLocaleString('pt-BR'),
        AceitaComunicacao: r.consent_marketing ? 'Sim' : 'Não',
        CheckIn: r.checked_in ? 'Compareceu' : 'Não compareceu',
        Status: r.status === 'confirmed' ? 'Confirmada' : 'Cancelada',
      }
    })
  }

  if (loading) return <p>Carregando inscritos...</p>

  return (
    <div>
      <h2>Inscritos</h2>
      <p style={{ opacity: 0.6, fontSize: 14 }}>{filtered.length} de {registrations.length} inscrições</p>

      <div className="toolbar">
        <input
          placeholder="Buscar por nome, CPF, e-mail ou telefone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <select value={filterWorkshop} onChange={(e) => setFilterWorkshop(e.target.value)}>
          <option value="">Todas as oficinas</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>{w.name} — {w.teacher}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="confirmed">Confirmada</option>
          <option value="cancelled">Cancelada</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={filterMinors} onChange={(e) => setFilterMinors(e.target.checked)} />
          Só menores de idade
        </label>
        <button className="btn-sm ok" onClick={exportAll}>Exportar inscrições (CSV)</button>
        {filterWorkshop && (
          <button className="btn-sm" onClick={() => exportWorkshop(filterWorkshop)}>Exportar só esta oficina</button>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>Nascimento</th>
              <th>Idade</th>
              <th>Autorização resp.</th>
              <th>Oficina</th>
              <th>Dia / Horário</th>
              <th>Status</th>
              <th>Check-in</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const age = ageOf(r)
              const minor = isMinor(r)
              return (
                <tr key={r.id}>
                  <td>{r.code}</td>
                  <td>{r.full_name}</td>
                  <td>{r.cpf}</td>
                  <td>{r.phone}</td>
                  <td>{r.email}</td>
                  <td>{r.birth_date ?? '—'}</td>
                  <td>{age ?? '—'}{minor && <span className="badge ultimas" style={{ marginLeft: 6 }}>Menor</span>}</td>
                  <td>
                    {minor ? (
                      <select
                        value={r.guardian_authorization_status}
                        onChange={(e) => handleGuardianStatus(r.id, e.target.value as GuardianStatus)}
                        style={{ background: 'var(--preto)', color: 'var(--branco)', border: '1px solid var(--borda)', borderRadius: 4, fontSize: 12, padding: '4px 6px' }}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="confirmada">Confirmada</option>
                      </select>
                    ) : (
                      <span style={{ opacity: 0.5, fontSize: 12 }}>Não necessária</span>
                    )}
                  </td>
                  <td>{r.workshops?.name} — {r.workshops?.teacher}</td>
                  <td>{r.workshops && formatDayLong(r.workshops.event_day)} · {r.workshops?.start_time}</td>
                  <td><span className={`status-tag ${r.status}`}>{r.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}</span></td>
                  <td>
                    <input
                      type="checkbox"
                      checked={r.checked_in}
                      onChange={(e) => handleCheckin(r.id, e.target.checked)}
                      disabled={r.status !== 'confirmed'}
                    />
                  </td>
                  <td>
                    {r.status === 'confirmed' ? (
                      <button className="btn-sm danger" onClick={() => handleCancel(r.id)}>Cancelar</button>
                    ) : (
                      <button className="btn-sm ok" onClick={() => handleReactivate(r.id)}>Reativar</button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={13} style={{ textAlign: 'center', opacity: 0.6, padding: 20 }}>Nenhuma inscrição encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
