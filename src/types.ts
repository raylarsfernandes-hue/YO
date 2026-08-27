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
export type GuardianStatus = 'nao_necessaria' | 'pendente' | 'confirmada'

export interface RegistrationRow {
  id: string
  code: string
  workshop_id: string
  full_name: string
  cpf: string
  phone: string
  email: string
  instagram: string | null
  birth_date: string | null
  consent_required: boolean
  image_consent: boolean
  guardian_ack: boolean
  guardian_authorization_status: GuardianStatus
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

export interface EventSettings {
  location_name: string
  location_address: string
  event_start_date: string
  event_end_date: string
  guardian_authorization_pdf_url: string | null
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
