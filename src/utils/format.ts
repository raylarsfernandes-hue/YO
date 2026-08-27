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

export function formatDayLong(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${d} de ${MONTHS[m - 1]}`
}

export function formatDateRangeShort(startISO: string, endISO: string): string {
  const [, sm, sd] = startISO.split('-').map(Number)
  const [, , ed] = endISO.split('-').map(Number)
  const monthAbbr = MONTHS[sm - 1].slice(0, 3).toUpperCase()
  if (startISO === endISO) return `${sd} ${monthAbbr}`
  return `${sd} + ${ed} ${monthAbbr}`
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
