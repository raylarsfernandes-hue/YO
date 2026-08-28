import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEventSettings } from '../hooks/useEventSettings'
import { useWorkshopSelection } from '../context/WorkshopSelectionContext'
import type { WorkshopPublic } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import WorkshopCard from '../components/WorkshopCard'
import { formatDayLong } from '../utils/format'

export default function Oficinas() {
  const navigate = useNavigate()
  const { settings } = useEventSettings()
  const { selected, toggle, isSelected, remove } = useWorkshopSelection()
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('workshops_public')
      .select('*')
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setWorkshops((data ?? []) as WorkshopPublic[])
        setLoading(false)
      })
  }, [])

  const dias = Array.from(new Set(workshops.map((w) => w.event_day))).sort()

  return (
    <div style={{ paddingBottom: selected.length > 0 ? 0 : undefined }}>
      <Header />

      <section className="section dark" style={{ paddingBottom: 20 }}>
        <div className="container">
          <div className="section-kicker">Programação</div>
          <h2>Oficinas disponíveis.</h2>
          <p className="lead">
            Selecione quantas oficinas quiser — de um dia ou dos dois — e faça uma única
            inscrição no final. Local: {settings.location_name}.
          </p>
        </div>
      </section>

      <section className="section dark" style={{ paddingTop: 0, paddingBottom: 40 }}>
        <div className="container">
          {loading && <p>Carregando oficinas...</p>}
          {!loading && workshops.length === 0 && (
            <p style={{ opacity: 0.7 }}>Nenhuma oficina cadastrada ainda.</p>
          )}
          {!loading && dias.map((dia) => (
            <div key={dia} style={{ marginBottom: 30 }}>
              <h3 style={{ fontSize: 18, color: 'var(--vermelho)', marginBottom: 4 }}>
                {formatDayLong(dia)}
              </h3>
              <div className="workshops-grid">
                {workshops.filter((w) => w.event_day === dia).map((w) => (
                  <WorkshopCard key={w.id} workshop={w} selected={isSelected(w.id)} onToggle={toggle} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {selected.length > 0 && (
        <div className="selection-bar">
          <div>
            <strong>{selected.length} oficina{selected.length > 1 ? 's' : ''} selecionada{selected.length > 1 ? 's' : ''}</strong>
            <div className="selection-list">
              {selected.map((w) => (
                <span key={w.id} style={{ marginRight: 10 }}>
                  {w.name} ({w.teacher})
                  <button
                    type="button"
                    onClick={() => remove(w.id)}
                    style={{ background: 'none', border: 'none', marginLeft: 4, cursor: 'pointer', color: 'inherit', opacity: 0.7 }}
                    aria-label={`Remover ${w.name}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
          <button type="button" className="btn-continue" onClick={() => navigate('/inscricao')}>
            Inscrever-se nas selecionadas →
          </button>
        </div>
      )}

      <Footer />
    </div>
  )
}
