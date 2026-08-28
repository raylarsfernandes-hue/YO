import type { WorkshopPublic } from '../types'
import { resolveImageUrl } from '../utils/image'

interface Props {
  workshop: WorkshopPublic
  onClose: () => void
}

export default function ProfessorModal({ workshop, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>

        {workshop.teacher_photo_url ? (
          <img src={resolveImageUrl(workshop.teacher_photo_url)!} alt={workshop.teacher} className="professor-photo-lg" />
        ) : (
          <div className="professor-photo-lg placeholder">{workshop.teacher.charAt(0)}</div>
        )}

        <h3>{workshop.teacher}</h3>
        <div className="modality-tag">{workshop.name}</div>

        <p>
          {workshop.teacher_bio ?? 'A biografia deste professor ainda será divulgada pela organização do festival.'}
        </p>
      </div>
    </div>
  )
}
