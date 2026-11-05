import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSchedule } from '../hooks/useSchedule'
import { dayMonth, weekdayName, timeParts } from '../utils/format'

export default function ScheduleTabs() {
  const { items, dias, loading } = useSchedule()
  const [active, setActive] = useState<string | null>(null)
  const current = active && dias.includes(active) ? active : dias[0]

  if (loading) return <p className="sched-empty">Carregando programação...</p>
  if (dias.length === 0) return <p className="sched-empty">A programação será divulgada em breve.</p>

  const list = items.filter((i) => i.event_day === current)

  return (
    <div className="sched">
      <div className="sched-tabs" role="tablist" aria-label="Dia da programação">
        {dias.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={d === current}
            className={`sched-tab ${d === current ? 'active' : ''}`}
            onClick={() => setActive(d)}
          >
            <span className="sched-tab-date">{dayMonth(d)}</span>
            <span className="sched-tab-day">{weekdayName(d)}</span>
          </button>
        ))}
      </div>

      <div className="sched-list" key={current} role="tabpanel">
        {list.map((i, idx) => {
          const t = timeParts(i.start_time, i.duration_minutes)
          return (
            <div key={i.id} className="sched-card">
              <div className="sched-time">
                <strong>{t.from}</strong>
                <span>até {t.to}</span>
              </div>
              <div className="sched-body">
                <span className="sched-aula">Aula {idx + 1}</span>
                <h4>{i.name}</h4>
              </div>
            </div>
          )
        })}
      </div>

      <div className="sched-foot">
        <p>A inscrição vale para todas as aulas do dia escolhido.</p>
        <Link to="/inscricao" className="btn-primary">Fazer inscrição</Link>
      </div>
    </div>
  )
}
