import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEventSettings } from '../hooks/useEventSettings'
import { useWorkshopSelection } from '../context/WorkshopSelectionContext'
import type { WorkshopPublic, BatchResult } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  formatCPF, formatPhone, isValidCPF, isValidEmail, isValidBirthDate,
  formatDayLong, computeAge,
} from '../utils/format'

const ERROR_MESSAGES: Record<string, string> = {
  CPF_INVALIDO: 'O CPF informado não é válido.',
  EMAIL_INVALIDO: 'O e-mail informado não é válido.',
  NOME_INVALIDO: 'Informe o nome completo.',
  CONSENTIMENTO_OBRIGATORIO: 'É necessário aceitar o uso dos dados para concluir a inscrição.',
  CONSENTIMENTO_IMAGEM_OBRIGATORIO: 'É necessário autorizar o uso de imagem para concluir a inscrição.',
  CIENCIA_RESPONSAVEL_OBRIGATORIA: 'É necessário confirmar a ciência sobre a autorização do responsável.',
  DATA_NASCIMENTO_INVALIDA: 'Informe uma data de nascimento válida.',
  NENHUMA_OFICINA_SELECIONADA: 'Selecione ao menos uma oficina antes de continuar.',
  NAO_FOI_POSSIVEL_INSCREVER: 'Não foi possível concluir a inscrição. Tente novamente.',
}

export default function Inscricao() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { settings } = useEventSettings()
  const { selected, remove, toggle } = useWorkshopSelection()
  const [legacyChecked, setLegacyChecked] = useState(false)

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

  // compatibilidade com links antigos tipo /inscricao?workshop=ID (ex: vindos do Instagram)
  useEffect(() => {
    if (legacyChecked || selected.length > 0) return
    const legacyId = searchParams.get('workshop')
    if (legacyId) {
      supabase.from('workshops_public').select('*').eq('id', legacyId).maybeSingle().then(({ data }) => {
        if (data) toggle(data as WorkshopPublic)
        setLegacyChecked(true)
      })
    } else {
      setLegacyChecked(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isMinor = birthDate && isValidBirthDate(birthDate)
    ? computeAge(birthDate, settings.event_start_date) < 18
    : false

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (selected.length === 0) errs.workshops = 'Selecione ao menos uma oficina.'
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
    if (!validate()) return

    setSubmitting(true)
    const { data, error } = await supabase.rpc('register_for_workshops', {
      p_workshop_ids: selected.map((w) => w.id),
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
      return
    }

    const rows = (data ?? []) as BatchResult[]
    if (rows.length === 0) {
      setSubmitError('Todas as oficinas selecionadas já foram inscritas com esse CPF, ou as inscrições estão encerradas.')
      return
    }

    const batchId = rows[0].batch_id
    navigate(`/confirmacao/${batchId}`)
  }

  return (
    <div>
      <Header />

      <section className="section dark" style={{ paddingBottom: 20 }}>
        <div className="container">
          <div className="section-kicker">Última etapa</div>
          <h2>Finalize sua inscrição.</h2>
          <p className="lead">Preencha seus dados uma única vez para todas as oficinas selecionadas.</p>
        </div>
      </section>

      <section className="section off">
        <div className="container">
          <div className="form-panel">
            <h3>Oficinas selecionadas</h3>

            {selected.length === 0 ? (
              <div className="selected-summary">
                Nenhuma oficina selecionada ainda.{' '}
                <Link to="/oficinas" style={{ color: 'var(--amarelo)' }}>Voltar para escolher</Link>.
              </div>
            ) : (
              <div className="selected-summary">
                {selected.map((w) => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>
                      <strong>{w.name}</strong> — {w.teacher} · {formatDayLong(w.event_day)} às {w.start_time}
                      {w.status === 'esgotada' && <span style={{ color: 'var(--vermelho)' }}> (lista de espera)</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(w.id)}
                      style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.6, cursor: 'pointer' }}
                    >
                      remover
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.workshops && <div className="error-msg" style={{ marginBottom: 14 }}>{errors.workshops}</div>}

            <h3 style={{ marginTop: 26 }}>Seus dados</h3>
            <p style={{ opacity: 0.7, fontSize: 14 }}>Válidos para todas as oficinas selecionadas.</p>

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
                      <a className="pdf-link" href={settings.guardian_authorization_pdf_url} target="_blank" rel="noreferrer">
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
                <input type="checkbox" checked={imageConsent} onChange={(e) => setImageConsent(e.target.checked)} />
                <span>
                  Autorizo gratuitamente o uso da minha imagem e voz em fotografias, vídeos e demais
                  registros realizados durante o Sumaré Hip Hop Festival, para fins de divulgação
                  institucional, cultural e promocional do evento e de seus realizadores. *
                </span>
              </div>
              {errors.imageConsent && <div className="error-msg" style={{ marginTop: -10, marginBottom: 14 }}>{errors.imageConsent}</div>}

              <div className={`checkbox-field ${errors.consentRequired ? 'error' : ''}`}>
                <input type="checkbox" checked={consentRequired} onChange={(e) => setConsentRequired(e.target.checked)} />
                <span>
                  Declaro que as informações fornecidas são verdadeiras e autorizo o uso dos meus
                  dados para realização da inscrição e comunicações relacionadas ao Sumaré Hip Hop Festival. *
                </span>
              </div>
              {errors.consentRequired && <div className="error-msg" style={{ marginTop: -10, marginBottom: 14 }}>{errors.consentRequired}</div>}

              {isMinor && (
                <>
                  <div className={`checkbox-field ${errors.guardianAck ? 'error' : ''}`}>
                    <input type="checkbox" checked={guardianAck} onChange={(e) => setGuardianAck(e.target.checked)} />
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
                <input type="checkbox" checked={consentMarketing} onChange={(e) => setConsentMarketing(e.target.checked)} />
                <span>Aceito receber informações sobre futuras ações, eventos e projetos relacionados ao Sumaré Hip Hop Festival.</span>
              </div>

              <button type="submit" className="submit-btn" disabled={submitting || selected.length === 0}>
                {submitting ? 'Enviando...' : `Confirmar inscrição${selected.length > 1 ? ` (${selected.length} oficinas)` : ''}`}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
