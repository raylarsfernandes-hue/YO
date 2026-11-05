import type { Teacher } from '../types'
import { resolveImageUrl } from '../utils/image'

interface Props {
  teacher: Teacher
  onClose: () => void
}

export default function ProfessorModal({ teacher, onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>

        {teacher.photo_url ? (
          <img src={resolveImageUrl(teacher.photo_url)!} alt={teacher.name} className="professor-photo-lg" />
        ) : (
          <div className="professor-photo-lg placeholder">{teacher.name.charAt(0)}</div>
        )}

        <h3>{teacher.name}</h3>
        {teacher.modality && <div className="modality-tag">{teacher.modality}</div>}

        <p>{teacher.bio ?? 'A apresentação deste professor ainda será divulgada pela organização.'}</p>
      </div>
    </div>
  )
}
