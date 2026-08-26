import type { WorkshopPublic } from '../types'
import { statusLabel } from '../utils/format'

interface Props {
  workshop: WorkshopPublic
  onSelect: (workshop: WorkshopPublic) => void
}

export default function WorkshopCard({ workshop: w, onSelect }: Props) {
  const pct = Math.min(100, Math.round((w.taken / Math.max(w.max_vagas, 1)) * 100))
  const disabled = w.status === 'esgotada' || w.status === 'encerrada'

  return (
    <div className={`workshop-card ${w.status}`}>
      <div className="card-top">
        <span className="day-tag">{w.start_time.slice(0, 5)}</span>
        <h3 className="modality">{w.name}</h3>
        <div className="teacher">{w.teacher}</div>
        <div className="time">{w.duration_minutes} min de oficina</div>
      </div>

      <div className="card-body">
        <div className="progress-bar"><div style={{ width: `${pct}%` }} /></div>
        <div className="vagas-row">
          <span>
            {disabled ? '0' : w.vagas_restantes} vaga{w.vagas_restantes === 1 ? '' : 's'} disponíve{w.vagas_restantes === 1 ? 'l' : 'is'}
          </span>
          <span className={`badge ${w.status}`}>{statusLabel(w.status)}</span>
        </div>

        <button className="cta" disabled={disabled} onClick={() => onSelect(w)}>
          {disabled ? statusLabel(w.status) : <>Quero essa aula <span>→</span></>}
        </button>
      </div>
    </div>
  )
}
