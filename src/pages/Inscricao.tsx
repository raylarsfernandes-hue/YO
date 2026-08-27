import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEventSettings } from '../hooks/useEventSettings'
import type { WorkshopPublic } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import WorkshopCard from '../components/WorkshopCard'
import {
  formatCPF, formatPhone, isValidCPF, isValidEmail, isValidBirthDate,
  formatDayLong, computeAge,
} from '../utils/format'

const ERROR_MESSAGES: Record<string, string> = {
  ESGOTADA: 'Que pena — essa oficina acabou de esgotar as vagas. Escolha outra abaixo.',
  JA_INSCRITO: 'Você já possui inscrição nesta atividade.',
  CPF_INVALIDO: 'O CPF informado não é válido.',
  EMAIL_INVALIDO: 'O e-mail informado não é válido.',
  NOME_INVALIDO: 'Informe o nome completo.',
  INSCRICOES_ENCERRADAS: 'As inscrições para esta oficina foram encerradas.',
  CONSENTIMENTO_OBRIGATORIO: 'É necessário aceitar o uso dos dados para concluir a inscrição.',
  CONSENTIMENTO_IMAGEM_OBRIGATORIO: 'É necessário autorizar o uso de imagem para concluir a inscrição.',
  CIENCIA_RESPONSAVEL_OBRIGATORIA: 'É necessário confirmar a ciência sobre a autorização do responsável.',
  DATA_NASCIMENTO_INVALIDA: 'Informe uma data de nascimento válida.',
  OFICINA_NAO_ENCONTRADA: 'Oficina não encontrada. Atualize a página e tente novamente.',
}

export default function Inscricao() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const formRef = useRef<HTMLDivElement>(null)
  const { settings } = useEventSettings()

  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<WorkshopPublic | null>(null)
  const [preselectApplied, setPreselectApplied] = useState(false)

  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [imageConsent, setImageConsent] = useState(false)
  const [consentRequired, setConsentRequired] = useState(false)
  const [guardianAck, setGuardianAck] = useState(false)
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

  // pré-seleciona a oficina se a pessoa veio de /oficinas com ?workshop=ID
  useEffect(() => {
    if (preselectApplied || loading || workshops.length === 0) return
    const workshopId = searchParams.get('workshop')
    if (workshopId) {
      const found = workshops.find((w) => w.id === workshopId)
      if (found) {
        setSelected(found)
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    }
    setPreselectApplied(true)
  }, [loading, workshops, searchParams, preselectApplied])

  const isMinor = birthDate && isValidBirthDate(birthDate)
    ? computeAge(birthDate, settings.event_start_date) < 18
    : false

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
    if (!birthDate || !isValidBirthDate(birthDate)) errs.birthDate = 'Informe uma data de nascimento válida.'
    if (!imageConsent) errs.imageConsent = 'É necessário autorizar o uso de imagem.'
    if (!consentRequired) errs.consentRequired = 'É necessário aceitar para continuar.'
    if (isMinor && !guardianAck) errs.guardianAck = 'É necessário confirmar a ciência sobre a autorização do responsável.'
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
      p_birth_date: birthDate,
      p_consent_required: consentRequired,
      p_image_consent: imageConsent,
      p_guardian_ack: guardianAck,
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
                  <WorkshopCard key={w.id} workshop={w} onSelect={handleSelect} location={settings.location_name} />
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
            <p style={{ opacity: 0.7, fontSize: 14 }}>Preencha para confirmar sua vaga.</p>

            {selected ? (
              <div className="selected-summary">
                <strong>{selected.name}</strong> — {selected.teacher}
                <br />
                {formatDayLong(selected.event_day)} às {selected.start_time} · {settings.location_name}
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

              <div className={`field ${errors.birthDate ? 'error' : ''}`}>
                <label>Data de nascimento *</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                {errors.birthDate && <div className="error-msg">{errors.birthDate}</div>}
              </div>

              <div className="field">
                <label>Instagram (opcional)</label>
                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuusuario" />
              </div>

              {isMinor && (
                <div className="minor-notice">
                  Você é menor de 18 anos (considerando a idade na data do evento). Para participar,
                  será necessária autorização assinada pelo pai, mãe ou responsável legal.
                  {settings.guardian_authorization_pdf_url ? (
                    <div>
                      <a
                        className="pdf-link"
                        href={settings.guardian_authorization_pdf_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Baixar autorização
                      </a>
                    </div>
                  ) : (
                    <div style={{ opacity: 0.7, marginTop: 8 }}>
                      O modelo de autorização será disponibilizado em breve pela organização do evento.
                    </div>
                  )}
                </div>
              )}

              <div className="consent-group-title">Autorizações obrigatórias</div>

              <div className={`checkbox-field ${errors.imageConsent ? 'error' : ''}`}>
                <input
                  type="checkbox"
                  checked={imageConsent}
                  onChange={(e) => setImageConsent(e.target.checked)}
                />
                <span>
                  Autorizo gratuitamente o uso da minha imagem e voz em fotografias, vídeos e demais
                  registros realizados durante o Sumaré Hip Hop Festival, para fins de divulgação
                  institucional, cultural e promocional do evento e de seus realizadores. *
                </span>
              </div>
              {errors.imageConsent && <div className="error-msg" style={{ marginTop: -10, marginBottom: 14 }}>{errors.imageConsent}</div>}

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

              {isMinor && (
                <>
                  <div className={`checkbox-field ${errors.guardianAck ? 'error' : ''}`}>
                    <input
                      type="checkbox"
                      checked={guardianAck}
                      onChange={(e) => setGuardianAck(e.target.checked)}
                    />
                    <span>
                      Declaro que estou ciente de que preciso apresentar a autorização assinada pelo
                      meu responsável para participar das atividades. *
                    </span>
                  </div>
                  {errors.guardianAck && <div className="error-msg" style={{ marginTop: -10, marginBottom: 14 }}>{errors.guardianAck}</div>}
                </>
              )}

              <div className="consent-group-title optional">Autorização opcional</div>

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
