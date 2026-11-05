export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function isValidCPF(cpfRaw: string): boolean {
  const cpf = cpfRaw.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf[10])) return false

  return true
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

const WEEKDAYS_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// Dia escolhido pelo participante: "Sábado, 21/11" e "Domingo, 22/11"
export function formatDayLong(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS_LONG[date.getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

// "21/11/2026 — Sábado"
export function formatDayOption(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} — ${WEEKDAYS_LONG[date.getDay()]}`
}

// "14h00 às 15h10"
export function formatTimeRange(start: string, durationMinutes: number): string {
  const [h, m] = start.split(':').map(Number)
  const from = h * 60 + m
  const f = (mins: number) =>
    `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}h${String(mins % 60).padStart(2, '0')}`
  return `${f(from)} às ${f(from + durationMinutes)}`
}

// { from: "14h00", to: "15h10" }
export function timeParts(start: string, durationMinutes: number): { from: string; to: string } {
  const [h, m] = start.split(':').map(Number)
  const from = h * 60 + m
  const f = (mins: number) =>
    `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}h${String(mins % 60).padStart(2, '0')}`
  return { from: f(from), to: f(from + durationMinutes) }
}

// "SÁBADO — 21/11"
export function formatDayHeading(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS_LONG[date.getDay()].toUpperCase()} — ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

// "21/11" | "21 e 22/11" (para listas do admin e exportação)
export function formatParticipation(days: string[]): string {
  const sorted = Array.from(new Set(days)).sort()
  const parts = sorted.map((iso) => {
    const [, m, d] = iso.split('-').map(Number)
    return { d: String(d).padStart(2, '0'), m: String(m).padStart(2, '0') }
  })
  if (parts.length === 0) return '—'
  if (parts.length === 1) return `${parts[0].d}/${parts[0].m}`
  if (parts.every((p) => p.m === parts[0].m)) {
    return `${parts.map((p) => p.d).join(' e ')}/${parts[0].m}`
  }
  return parts.map((p) => `${p.d}/${p.m}`).join(' e ')
}

// "21 e 22 de novembro de 2026" para vários dias; "21 de novembro de 2026" para um
export function formatParticipationLong(days: string[]): string {
  const sorted = Array.from(new Set(days)).sort()
  if (sorted.length === 0) return ''
  if (sorted.length === 1) return formatDateRangeShort(sorted[0], sorted[0])
  return formatDateRangeShort(sorted[0], sorted[sorted.length - 1])
}

// Destaque da home: "21 e 22 de novembro de 2026"
export function formatDateRangeShort(startISO: string, endISO: string): string {
  const [sy, sm, sd] = startISO.split('-').map(Number)
  const [, em, ed] = endISO.split('-').map(Number)
  if (startISO === endISO) return `${sd} de ${MONTHS[sm - 1]} de ${sy}`
  if (sm !== em) return `${sd} de ${MONTHS[sm - 1]} e ${ed} de ${MONTHS[em - 1]} de ${sy}`
  return `${sd} e ${ed} de ${MONTHS[sm - 1]} de ${sy}`
}

// "Sábado" / "Domingo"
export function weekdayName(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return WEEKDAYS_LONG[new Date(y, m - 1, d).getDay()]
}

// "21/11"
export function dayMonth(isoDate: string): string {
  const [, m, d] = isoDate.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

export function formatDayShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS[date.getDay()]} • ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'disponivel':
      return 'Disponível'
    case 'ultimas':
      return 'Últimas vagas'
    case 'esgotada':
      return 'Esgotada'
    case 'esgotado':
      return 'Esgotado'
    case 'encerrada':
      return 'Inscrições encerradas'
    default:
      return status
  }
}

/** Idade que a pessoa terá NA DATA DE REFERÊNCIA (ex: início do evento), não hoje. */
export function computeAge(birthDateISO: string, referenceDateISO: string): number {
  const birth = new Date(birthDateISO + 'T00:00:00')
  const ref = new Date(referenceDateISO + 'T00:00:00')
  let age = ref.getFullYear() - birth.getFullYear()
  const m = ref.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--
  return age
}

export function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T00:00:00')
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date > today) return false
  if (date.getFullYear() < 1900) return false
  return true
}

export function guardianStatusLabel(status: string): string {
  switch (status) {
    case 'nao_necessaria':
      return 'Não necessária'
    case 'pendente':
      return 'Pendente'
    case 'confirmada':
      return 'Confirmada'
    default:
      return status
  }
}
