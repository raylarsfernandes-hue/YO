export type DayStatus = 'disponivel' | 'ultimas' | 'esgotado'

// Programação pública: aula + horário, sem professor
export interface ScheduleItem {
  id: string
  name: string
  event_day: string // YYYY-MM-DD
  start_time: string
  duration_minutes: number
  order_index: number
}

// Uso interno do admin (tabela workshops)
export interface Workshop {
  id: string
  name: string
  event_day: string
  start_time: string
  duration_minutes: number
  active: boolean
  order_index: number
  created_at: string
}

export interface Teacher {
  id: string
  name: string
  modality: string | null
  photo_url: string | null
  bio: string | null
  order_index: number
  active: boolean
}

export interface DayPublic {
  event_day: string
  day_number: number
  max_vagas: number
  taken: number
  vagas_restantes: number
  status: DayStatus
}

export type RegistrationStatus = 'confirmed' | 'waitlisted' | 'cancelled'
export type GuardianStatus = 'nao_necessaria' | 'pendente' | 'confirmada'

export interface RegistrationRow {
  id: string
  code: string
  event_day: string
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
  waitlist_position: number | null
  batch_id: string | null
  checked_in: boolean
  created_at: string
}

export interface EventSettings {
  location_name: string
  location_address: string
  map_query: string | null
  event_start_date: string
  event_end_date: string
  max_vagas_dia1: number
  max_vagas_dia2: number
  guardian_authorization_pdf_url: string | null
}

export interface BatchResult {
  code: string
  event_day: string
  result_status: 'confirmed' | 'waitlisted'
  batch_id: string
}

export interface ConfirmationRow {
  code: string
  full_name: string
  event_day: string
  status: string
  batch_id: string
}
