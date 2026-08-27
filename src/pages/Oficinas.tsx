import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEventSettings } from '../hooks/useEventSettings'
import type { WorkshopPublic } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import WorkshopCard from '../components/WorkshopCard'
import { formatDayLong } from '../utils/format'

export default function Oficinas() {
  const navigate = useNavigate()
  const { settings } = useEventSettings()
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

  function handleSelect(w: WorkshopPublic) {
    navigate(`/inscricao?workshop=${w.id}`)
  }

  const dias = Array.from(new Set(workshops.map((w) => w.event_day))).sort()

  return (
    <div>
      <Header />

      <section className="section dark" style={{ paddingBottom: 20 }}>
        <div className="container">
          <div className="section-kicker">Programação</div>
          <h2>Oficinas disponíveis.</h2>
          <p className="lead">
            Todas as oficinas do Sumaré Hip Hop Festival, com vagas atualizadas em tempo real.
            Escolha a sua e garanta seu lugar — é gratuito.
          </p>
        </div>
      </section>

      <section className="section dark" style={{ paddingTop: 0 }}>
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
                  <WorkshopCard key={w.id} workshop={w} onSelect={handleSelect} location={settings.location_name} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
