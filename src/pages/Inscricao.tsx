import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { WorkshopPublic } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import WorkshopCard from '../components/WorkshopCard'
import { formatCPF, formatPhone, isValidCPF, isValidEmail, formatDayLong } from '../utils/format'
import scribble from '../assets/scribble_yellow.png'

const ERROR_MESSAGES: Record<string, string> = {
  ESGOTADA: 'Que pena — essa oficina acabou de esgotar as vagas. Escolha outra abaixo.',
  JA_INSCRITO: 'Você já possui inscrição nesta atividade.',
  CPF_INVALIDO: 'O CPF informado não é válido.',
  EMAIL_INVALIDO: 'O e-mail informado não é válido.',
  NOME_INVALIDO: 'Informe o nome completo.',
  INSCRICOES_ENCERRADAS: 'As inscrições para esta oficina foram encerradas.',
  CONSENTIMENTO_OBRIGATORIO: 'É necessário aceitar o uso dos dados para concluir a inscrição.',
  OFICINA_NAO_ENCONTRADA: 'Oficina não encontrada. Atualize a página e tente novamente.',
}

export default function Inscricao() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLDivElement>(null)

  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<WorkshopPublic | null>(null)

  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [consentRequired, setConsentRequired] = useState(false)
  const [consentMarketing, setConsentMarketing] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadWorkshops() {
    const { data } = await supabase
      .from('workshops_public')
      .select('*')
      .order('order_index', { ascending: true })
    setWorkshops((data ?? []) as WorkshopPublic[])
    setLoading(false)
  }

  useEffect(() => {
    loadWorkshops()
  }, [])

  function handleSelect(w: WorkshopPublic) {
    setSelected(w)
    setSubmitError(null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!fullName.trim() || fullName.trim().length < 3) errs.fullName = 'Informe seu nome completo.'
    if (!isValidCPF(cpf)) errs.cpf = 'CPF inválido.'
    if (phone.replace(/\D/g, '').length < 10) errs.phone = 'Informe um telefone/WhatsApp válido.'
    if (!isValidEmail(email)) errs.email = 'E-mail inválido.'
    if (!consentRequired) errs.consentRequired = 'É necessário aceitar para continuar.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    if (!selected) {
      setSubmitError('Selecione uma oficina antes de enviar.')
      return
    }
    if (!validate()) return

    setSubmitting(true)
    const { data, error } = await supabase.rpc('register_for_workshop', {
      p_workshop_id: selected.id,
      p_full_name: fullName,
      p_cpf: cpf,
      p_phone: phone,
      p_email: email,
      p_instagram: instagram || null,
      p_consent_required: consentRequired,
      p_consent_marketing: consentMarketing,
    })
    setSubmitting(false)

    if (error) {
      const key = error.message?.match(/[A-Z_]+/)?.[0] ?? ''
      setSubmitError(ERROR_MESSAGES[key] ?? 'Não foi possível concluir a inscrição. Tente novamente.')
      loadWorkshops() // refresca vagas em caso de esgotamento
      return
    }

    const row = Array.isArray(data) ? data[0] : data
    navigate(`/confirmacao/${row.code}`)
  }

  const dias = Array.from(new Set(workshops.map((w) => w.event_day))).sort()

  return (
    <div>
      <Header />

      <section className="section dark" style={{ paddingBottom: 20 }}>
        <div className="container">
          <img src={scribble} alt="" style={{ position: 'absolute', top: 20, right: 20, width: 110, opacity: 0.55 }} aria-hidden="true" />
          <div className="section-kicker">Inscrições abertas</div>
          <h2>Escolha sua oficina.</h2>
          <p className="lead">
            Toque em "Quero me inscrever" na aula desejada e preencha seus dados logo abaixo.
            Vagas limitadas e controladas em tempo real.
          </p>
        </div>
      </section>

      <section className="section dark" style={{ paddingTop: 0 }}>
        <div className="container">
          {loading && <p>Carregando oficinas...</p>}
          {!loading && dias.map((dia) => (
            <div key={dia} style={{ marginBottom: 30 }}>
              <h3 style={{ fontSize: 18, color: 'var(--vermelho)', marginBottom: 4 }}>
                {formatDayLong(dia)}
              </h3>
              <div className="workshops-grid">
                {workshops.filter((w) => w.event_day === dia).map((w) => (
                  <WorkshopCard key={w.id} workshop={w} onSelect={handleSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section off" ref={formRef}>
        <div className="container">
          <div className="form-panel">
            <h3>Seus dados</h3>
            <p style={{ opacity: 0.65, fontSize: 14 }}>Preencha para confirmar sua vaga.</p>

            {selected ? (
              <div className="selected-summary">
                <strong>{selected.name}</strong> — {selected.teacher}
                <br />
                {formatDayLong(selected.event_day)} às {selected.start_time}
              </div>
            ) : (
              <div className="selected-summary">Selecione uma oficina acima para continuar.</div>
            )}

            {submitError && <div className="form-alert">{submitError}</div>}

            <form onSubmit={handleSubmit}>
              <div className={`field ${errors.fullName ? 'error' : ''}`}>
                <label>Nome completo *</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                {errors.fullName && <div className="error-msg">{errors.fullName}</div>}
              </div>

              <div className={`field ${errors.cpf ? 'error' : ''}`}>
                <label>CPF *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                />
                {errors.cpf && <div className="error-msg">{errors.cpf}</div>}
              </div>

              <div className={`field ${errors.phone ? 'error' : ''}`}>
                <label>Telefone / WhatsApp *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(19) 90000-0000"
                />
                {errors.phone && <div className="error-msg">{errors.phone}</div>}
              </div>

              <div className={`field ${errors.email ? 'error' : ''}`}>
                <label>E-mail *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                {errors.email && <div className="error-msg">{errors.email}</div>}
              </div>

              <div className="field">
                <label>Instagram (opcional)</label>
                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuusuario" />
              </div>

              <div className={`checkbox-field ${errors.consentRequired ? 'error' : ''}`}>
                <input
                  type="checkbox"
                  checked={consentRequired}
                  onChange={(e) => setConsentRequired(e.target.checked)}
                />
                <span>
                  Declaro que as informações fornecidas são verdadeiras e autorizo o uso dos meus
                  dados para realização da inscrição e comunicações relacionadas ao Sumaré Hip Hop Festival. *
                </span>
              </div>
              {errors.consentRequired && <div className="error-msg" style={{ marginTop: -10, marginBottom: 14 }}>{errors.consentRequired}</div>}

              <div className="checkbox-field">
                <input
                  type="checkbox"
                  checked={consentMarketing}
                  onChange={(e) => setConsentMarketing(e.target.checked)}
                />
                <span>
                  Aceito receber informações sobre futuras ações, eventos e projetos relacionados
                  ao Sumaré Hip Hop Festival.
                </span>
              </div>

              <button type="submit" className="submit-btn" disabled={submitting || !selected}>
                {submitting ? 'Enviando...' : 'Confirmar inscrição'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
