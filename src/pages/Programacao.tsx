import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useEventSettings } from '../hooks/useEventSettings'
import { useSchedule } from '../hooks/useSchedule'
import { formatDayHeading, formatDateRangeShort, formatTimeRange } from '../utils/format'

export default function Programacao() {
  const { settings } = useEventSettings()
  const { items, dias, loading } = useSchedule()

  return (
    <div>
      <Header />

      <section className="section dark" style={{ paddingBottom: 20 }}>
        <div className="container">
          <div className="section-kicker">{formatDateRangeShort(settings.event_start_date, settings.event_end_date)}</div>
          <h2>Programação.</h2>
          <p className="lead">
            Quatro aulas por dia, com entrada gratuita. A inscrição vale para todas as aulas do dia
            escolhido, e você pode participar de um dia ou dos dois. Local: {settings.location_name}.
          </p>
        </div>
      </section>

      <section className="section dark" style={{ paddingTop: 0, paddingBottom: 40 }}>
        <div className="container">
          {loading && <p>Carregando programação...</p>}
          {!loading && items.length === 0 && (
            <p style={{ opacity: 0.7 }}>A programação será divulgada em breve.</p>
          )}

          <div className="schedule-days">
            {dias.map((dia) => (
              <div key={dia} className="schedule-day">
                <h3>{formatDayHeading(dia)}</h3>
                {items.filter((i) => i.event_day === dia).map((i, idx) => (
                  <div key={i.id} className="schedule-row">
                    <div className="schedule-num">Aula {idx + 1}</div>
                    <div className="schedule-info">
                      <div className="schedule-name">{i.name}</div>
                      <div className="schedule-time">Horário: {formatTimeRange(i.start_time, i.duration_minutes)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 34, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/inscricao" className="btn-primary">Fazer inscrição</Link>
            <Link to="/professores" className="btn-secondary">Conhecer os professores</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
