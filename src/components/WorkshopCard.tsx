import type { WorkshopPublic } from '../types'
import { formatDayLong, statusLabel } from '../utils/format'

interface Props {
  workshop: WorkshopPublic
  onSelect: (workshop: WorkshopPublic) => void
  location?: string
}

export default function WorkshopCard({ workshop: w, onSelect, location }: Props) {
  const pct = Math.min(100, Math.round((w.taken / Math.max(w.max_vagas, 1)) * 100))
  const disabled = w.status === 'esgotada' || w.status === 'encerrada'

  return (
    <div className={`workshop-card ${w.status}`}>
      <div className="day-tag">{formatDayLong(w.event_day)} • {w.start_time}</div>
      <h3>{w.name}</h3>
      <div className="teacher">Professor(a): {w.teacher}</div>
      <div className="time">Duração: {w.duration_minutes} min{location ? ` · ${location}` : ''}</div>

      <div className="progress-bar"><div style={{ width: `${pct}%` }} /></div>
      <div className="vagas-row">
        <span>
          {disabled ? '0' : w.vagas_restantes} vaga{w.vagas_restantes === 1 ? '' : 's'} disponíve{w.vagas_restantes === 1 ? 'l' : 'is'}
        </span>
        <span className={`badge ${w.status}`}>{statusLabel(w.status)}</span>
      </div>

      <button className="cta" disabled={disabled} onClick={() => onSelect(w)}>
        {disabled ? statusLabel(w.status) : 'Quero me inscrever'}
      </button>
    </div>
  )
}
