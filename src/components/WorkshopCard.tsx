import { useState } from 'react'
import type { WorkshopPublic } from '../types'
import { statusLabel } from '../utils/format'
import { resolveImageUrl } from '../utils/image'
import ProfessorModal from './ProfessorModal'

interface Props {
  workshop: WorkshopPublic
  selected: boolean
  onToggle: (workshop: WorkshopPublic) => void
}

export default function WorkshopCard({ workshop: w, selected, onToggle }: Props) {
  const [showProfessor, setShowProfessor] = useState(false)
  const pct = Math.min(100, Math.round((w.taken / Math.max(w.max_vagas, 1)) * 100))
  const closed = w.status === 'encerrada'
  const full = w.status === 'esgotada'

  return (
    <div className={`workshop-card ${w.status} ${selected ? 'selected' : ''}`}>
      <div className="day-tag">{w.start_time.slice(0, 5)}</div>

      <div className="professor-row">
        {w.teacher_photo_url ? (
          <img src={resolveImageUrl(w.teacher_photo_url)!} alt={w.teacher} className="professor-photo" />
        ) : (
          <div className="professor-photo placeholder">{w.teacher.charAt(0)}</div>
        )}
        <div>
          <h3>{w.name}</h3>
          <div className="teacher">{w.teacher}</div>
        </div>
      </div>

      <div className="time">{w.duration_minutes} min de oficina</div>

      <div className="progress-bar"><div style={{ width: `${pct}%` }} /></div>
      <div className="vagas-row">
        <span>{closed ? '—' : full ? `${w.waiting} na espera` : `${w.vagas_restantes} vagas`}</span>
        <span className={`badge ${w.status}`}>{statusLabel(w.status)}</span>
      </div>

      <button type="button" className="btn-professor" onClick={() => setShowProfessor(true)}>
        Conheça o professor
      </button>

      <button
        type="button"
        className={`cta ${selected ? 'is-selected' : ''} ${full && !selected ? 'waitlist' : ''}`}
        disabled={closed}
        onClick={() => onToggle(w)}
      >
        {closed
          ? 'Inscrições encerradas'
          : selected
            ? 'Selecionada ✓'
            : full
              ? 'Entrar na lista de espera'
              : 'Selecionar oficina'}
      </button>

      {showProfessor && <ProfessorModal workshop={w} onClose={() => setShowProfessor(false)} />}
    </div>
  )
}
