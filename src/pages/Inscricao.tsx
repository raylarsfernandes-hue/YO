import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEventSettings } from '../hooks/useEventSettings'
import { useDays } from '../hooks/useDays'
import type { BatchResult } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import {
  formatCPF, formatPhone, isValidCPF, isValidEmail, isValidBirthDate,
  formatDayOption, computeAge,
} from '../utils/format'

type DayChoice = 'd1' | 'd2' | 'both'

const ERROR_MESSAGES: Record<string, string> = {
  CPF_INVALIDO: 'O CPF informado não é válido.',
  EMAIL_INVALIDO: 'O e-mail informado não é válido.',
  NOME_INVALIDO: 'Informe o nome completo.',
  CONSENTIMENTO_OBRIGATORIO: 'É necessário aceitar o uso dos dados para concluir a inscrição.',
  CONSENTIMENTO_IMAGEM_OBRIGATORIO: 'É necessário autorizar o uso de imagem para concluir a inscrição.',
  CIENCIA_RESPONSAVEL_OBRIGATORIA: 'É necessário confirmar a ciência sobre a autorização do responsável.',
  DATA_NASCIMENTO_INVALIDA: 'Informe uma data de nascimento válida.',
  NENHUM_DIA_SELECIONADO: 'Escolha em qual dia você quer participar.',
  DIA_INVALIDO: 'O dia escolhido não é válido. Atualize a página e tente de novo.',
  DIA_ESGOTADO: 'As vagas de um dos dias escolhidos acabaram. Atualize a página e escolha outra opção.',
  JA_INSCRITO: 'Você já está inscrito(a) para este dia.',
  NAO_FOI_POSSIVEL_INSCREVER: 'Não foi possível concluir a inscrição. Tente novamente.',
}

export default function Inscricao() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { settings } = useEventSettings()
  const { days, loading: loadingDays, reload: reloadDays } = useDays()
  const [choice, setChoice] = useState<DayChoice | null>(null)

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

  // links de campanha: /inscricao?dia=sabado | domingo | dois
  useEffect(() => {
    const dia = searchParams.get('dia')
    if (dia === 'sabado') setChoice('d1')
    else if (dia === 'domingo') setChoice('d2')
    else if (dia === 'dois') setChoice('both')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const day1 = days[0]
  const day2 = days[1]
  const day1Full = day1?.status === 'esgotado'
  const day2Full = day2?.status === 'esgotado'
  const bothDisabled = !day1 || !day2 || day1Full || day2Full

  function selectedDays(): string[] {
    if (choice === 'd1' && day1) return [day1.event_day]
    if (choice === 'd2' && day2) return [day2.event_day]
    if (choice === 'both' && day1 && day2) return [day1.event_day, day2.event_day]
    return []
  }

  const isMinor = birthDate && isValidBirthDate(birthDate)
    ? computeAge(birthDate, settings.event_start_date) < 18
    : false

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (selectedDays().length === 0) errs.days = 'Escolha em qual dia você quer participar.'
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
    const { data, error } = await supabase.rpc('register_for_days', {
      p_days: selectedDays(),
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
      const key = error.message?.match(/[A-Z_]{4,}/)?.[0] ?? ''
      if (key === 'JA_INSCRITO' && choice === 'both') {
        setSubmitError('Você já está inscrito(a) para os dois dias.')
      } else {
        setSubmitError(ERROR_MESSAGES[key] ?? 'Não foi possível concluir a inscrição. Tente novamente.')
      }
      if (key === 'DIA_ESGOTADO') reloadDays()
      return
    }

    const rows = (data ?? []) as BatchResult[]
    if (rows.length === 0) {
      setSubmitError('Não foi possível concluir a inscrição. Tente novamente.')
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
          <p className="lead">Escolha o dia em que quer participar e preencha seus dados. A inscrição vale para todas as aulas do dia escolhido.</p>
        </div>
      </section>

      <section className="section off">
        <div className="container">
          <div className="form-panel">
            <h3>Em qual dia você deseja participar?</h3>

            {loadingDays && <p style={{ opacity: 0.7 }}>Carregando vagas...</p>}

            {!loadingDays && days.length > 0 && (
              <div className={`day-options ${errors.days ? 'error' : ''}`} role="radiogroup" aria-label="Dia de participação">
                {[
                  { key: 'd1' as DayChoice, label: day1 && formatDayOption(day1.event_day), info: day1, disabled: !day1 || day1Full },
                  { key: 'd2' as DayChoice, label: day2 && formatDayOption(day2.event_day), info: day2, disabled: !day2 || day2Full },
                ].filter((o) => o.info).map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    role="radio"
                    aria-checked={choice === o.key}
                    disabled={o.disabled}
                    className={`day-option ${choice === o.key ? 'selected' : ''}`}
                    onClick={() => setChoice(o.key)}
                  >
                    <span className="day-option-title">{o.label}</span>
                    <span className={`day-option-vagas ${o.info!.status}`}>
                      {o.info!.status === 'esgotado' ? 'ESGOTADO' : `${o.info!.vagas_restantes} vagas disponíveis`}
                    </span>
                  </button>
                ))}

                {day1 && day2 && (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={choice === 'both'}
                    disabled={bothDisabled}
                    className={`day-option ${choice === 'both' ? 'selected' : ''}`}
                    onClick={() => setChoice('both')}
                  >
                    <span className="day-option-title">
                      {formatDayOption(day1.event_day).slice(0, 2)} e {formatDayOption(day2.event_day).slice(0, 5)}/{day2.event_day.slice(0, 4)} — Os dois dias
                    </span>
                    <span className={`day-option-vagas ${bothDisabled ? 'esgotado' : 'disponivel'}`}>
                      {bothDisabled ? 'Indisponível: um dos dias está esgotado' : 'Sábado e domingo'}
                    </span>
                  </button>
                )}
              </div>
            )}
            {!loadingDays && day1Full && day2Full && (
              <div className="form-alert" style={{ marginTop: 14 }}>
                As vagas dos dois dias estão esgotadas. Acompanhe as redes do encontro para novidades.
              </div>
            )}
            {!loadingDays && (day1Full !== day2Full) && (
              <p style={{ fontSize: 13, opacity: 0.75, marginTop: 10 }}>
                {day1Full ? 'O primeiro dia' : 'O segundo dia'} está esgotado, por isso a opção dos dois dias não está disponível.
              </p>
            )}
            {errors.days && <div className="error-msg" style={{ marginTop: 10 }}>{errors.days}</div>}

            <h3 style={{ marginTop: 26 }}>Seus dados</h3>
            <p style={{ opacity: 0.7, fontSize: 14 }}>Preencha uma vez só, vale para os dias escolhidos.</p>

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
                  registros realizados durante o Encontro de Danças Urbanas de Sumaré, para fins de divulgação
                  institucional, cultural e promocional do evento e de seus realizadores. *
                </span>
              </div>
              {errors.imageConsent && <div className="error-msg" style={{ marginTop: -10, marginBottom: 14 }}>{errors.imageConsent}</div>}

              <div className={`checkbox-field ${errors.consentRequired ? 'error' : ''}`}>
                <input type="checkbox" checked={consentRequired} onChange={(e) => setConsentRequired(e.target.checked)} />
                <span>
                  Declaro que as informações fornecidas são verdadeiras e autorizo o uso dos meus
                  dados para realização da inscrição e comunicações relacionadas ao Encontro de Danças Urbanas de Sumaré. *
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
                <span>Aceito receber informações sobre futuras ações, eventos e projetos relacionados ao Encontro de Danças Urbanas de Sumaré.</span>
              </div>

              <button type="submit" className="submit-btn" disabled={submitting || loadingDays}>
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
