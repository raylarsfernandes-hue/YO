import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'
import type { RegistrationRow, Workshop } from '../../types'
import { downloadCSV } from '../../utils/csv'
import { formatDayLong } from '../../utils/format'

export default function Inscritos() {
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterWorkshop, setFilterWorkshop] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return registrations.filter((r) => {
      if (filterWorkshop && r.workshop_id !== filterWorkshop) return false
      if (filterStatus && r.status !== filterStatus) return false
      if (term) {
        const haystack = `${r.full_name} ${r.cpf} ${r.email} ${r.phone}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [registrations, search, filterWorkshop, filterStatus])

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

  function exportAll() {
    downloadCSV('inscricoes-sumare-hiphop.csv', toCSVRows(filtered))
  }

  function exportWorkshop(workshopId: string) {
    const rows = registrations.filter((r) => r.workshop_id === workshopId)
    const w = workshops.find((w) => w.id === workshopId)
    downloadCSV(`inscritos-${w?.name ?? 'oficina'}-${w?.teacher ?? ''}.csv`.replace(/\s+/g, '-'), toCSVRows(rows))
  }

  function toCSVRows(rows: RegistrationRow[]) {
    return rows.map((r) => ({
      Codigo: r.code,
      Nome: r.full_name,
      CPF: r.cpf,
      Telefone: r.phone,
      Email: r.email,
      Instagram: r.instagram ?? '',
      Oficina: r.workshops?.name ?? '',
      Professor: r.workshops?.teacher ?? '',
      Dia: r.workshops ? formatDayLong(r.workshops.event_day) : '',
      Horario: r.workshops?.start_time ?? '',
      InscritoEm: new Date(r.created_at).toLocaleString('pt-BR'),
      AceitaComunicacao: r.consent_marketing ? 'Sim' : 'Não',
      CheckIn: r.checked_in ? 'Compareceu' : 'Não compareceu',
      Status: r.status === 'confirmed' ? 'Confirmada' : 'Cancelada',
    }))
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
              <th>Oficina</th>
              <th>Dia / Horário</th>
              <th>Inscrito em</th>
              <th>Status</th>
              <th>Check-in</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>{r.code}</td>
                <td>{r.full_name}</td>
                <td>{r.cpf}</td>
                <td>{r.phone}</td>
                <td>{r.email}</td>
                <td>{r.workshops?.name} — {r.workshops?.teacher}</td>
                <td>{r.workshops && formatDayLong(r.workshops.event_day)} · {r.workshops?.start_time}</td>
                <td>{new Date(r.created_at).toLocaleString('pt-BR')}</td>
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
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={11} style={{ textAlign: 'center', opacity: 0.6, padding: 20 }}>Nenhuma inscrição encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
