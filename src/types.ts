export type WorkshopStatus = 'disponivel' | 'ultimas' | 'esgotada' | 'encerrada'

export interface WorkshopPublic {
  id: string
  name: string
  teacher: string
  event_day: string // YYYY-MM-DD
  start_time: string
  duration_minutes: number
  max_vagas: number
  active: boolean
  order_index: number
  taken: number
  vagas_restantes: number
  status: WorkshopStatus
}

export interface Workshop {
  id: string
  name: string
  teacher: string
  event_day: string
  start_time: string
  duration_minutes: number
  max_vagas: number
  active: boolean
  order_index: number
  created_at: string
}

export type RegistrationStatus = 'confirmed' | 'cancelled'

export interface RegistrationRow {
  id: string
  code: string
  workshop_id: string
  full_name: string
  cpf: string
  phone: string
  email: string
  instagram: string | null
  consent_required: boolean
  consent_marketing: boolean
  status: RegistrationStatus
  checked_in: boolean
  created_at: string
  workshops?: {
    name: string
    teacher: string
    event_day: string
    start_time: string
  }
}

export interface ConfirmationData {
  code: string
  full_name: string
  workshop_name: string
  teacher: string
  event_day: string
  start_time: string
  status: string
}
