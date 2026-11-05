import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SupportStrip from '../components/SupportStrip'
import { useEventSettings } from '../hooks/useEventSettings'
import { useDays } from '../hooks/useDays'
import { useSchedule } from '../hooks/useSchedule'
import { formatDayHeading, formatDateRangeShort, formatTimeRange } from '../utils/format'
import heroDancer from '../assets/hero_dancer.webp'
import heroTitle from '../assets/logo_evento.webp'
import sobreDancer from '../assets/sobre_dancer.webp'
import sobreTitle from '../assets/sobre_title.webp'

export default function Home() {
  const { settings } = useEventSettings()
  const { days, loading } = useDays()
  const { items, dias } = useSchedule()

  const vagasDisponiveis = days.reduce((acc, d) => acc + d.vagas_restantes, 0)
  const mapQuery = encodeURIComponent(
    settings.map_query?.trim() || `${settings.location_name}, ${settings.location_address}`
  )

  return (
    <div>
      <Header />

      {/* 01 — Abertura */}
      <section className="hero">
        <div className="container">
          <div className="hero-copy">
            <img src={heroTitle} alt="Encontro de Danças Urbanas de Sumaré" className="hero-title-img" />
            <p className="sub">
              Dois dias de cultura urbana gratuita em Sumaré: aulas de dança, discotecagem,
              encontro e formação para quem já vive a cena e para quem está chegando agora.
            </p>
            <div className="hero-meta">
              <span className="pill amarelo">{formatDateRangeShort(settings.event_start_date, settings.event_end_date)}</span>
              <span className="pill">{settings.location_name}</span>
              <span className="pill vermelho">100% gratuito</span>
            </div>
            <div className="hero-actions">
              <Link to="/inscricao" className="btn-primary">Fazer inscrição</Link>
              <Link to="/programacao" className="btn-secondary">Ver programação</Link>
            </div>
            <SupportStrip className="support-strip-mobile" />
          </div>
          <div className="hero-illustration">
            <img src={heroDancer} alt="Bailarino em movimento — identidade visual do Encontro de Danças Urbanas de Sumaré" />
            <SupportStrip className="support-strip-desktop" />
          </div>
        </div>
      </section>

      {/* 02 — Informações + fotografia */}
      <section className="section off">
        <div className="container split-section">
          <div className="info-block">
            <div className="section-kicker">01 — Sobre o projeto</div>
            <img src={sobreTitle} alt="Cultura de rua, formação e encontro" className="sobre-title-img" />
            <p className="lead" style={{ marginTop: 14 }}>
              O encontro nasce como uma experiência gratuita de cultura urbana, dança, formação
              e desenvolvimento social, aberta para quem já vive a cena e para quem está
              chegando agora.
            </p>
            <div className="stats-row">
              <div className="stat-box"><div className="num">2</div><div className="label">Dias de evento</div></div>
              <div className="stat-box"><div className="num">8</div><div className="label">Aulas</div></div>
              <div className="stat-box"><div className="num">100%</div><div className="label">Gratuito</div></div>
              <div className="stat-box highlight">
                <div className="num">{loading ? '—' : vagasDisponiveis}</div>
                <div className="label">Vagas disponíveis agora</div>
              </div>
            </div>
          </div>
          <div className="photo-frame photo-frame--image">
            <img src={sobreDancer} alt="Cultura, dança, resistência, formação, comunidade" />
          </div>
        </div>
      </section>

      {/* 03 — Manifesto visual */}
      <section className="manifest-section">
        <div className="container">
          <div className="section-kicker">02 — Conceito</div>
          <h2>Uma marca<br />cultural própria.</h2>
          <p className="manifest-text">
            Rua, movimento, cultura, encontro, formação e território. O Encontro de Danças Urbanas
            de Sumaré existe para fortalecer a cena local e abrir acesso à cultura, com força
            para crescer além de uma única edição.
          </p>
          <Link to="/sobre" className="link-more">Conheça o projeto completo →</Link>
        </div>
      </section>

      {/* 04 — Programação */}
      <section className="section dark" id="programacao">
        <div className="container">
          <div className="section-kicker">03 — Programação</div>
          <h2>Dois dias de aula.</h2>
          <p className="lead">Quatro aulas por dia. A inscrição vale para o dia inteiro.</p>

          <div className="schedule-days" style={{ marginTop: 28 }}>
            {dias.map((dia) => (
              <div key={dia} className="schedule-day">
                <h3>{formatDayHeading(dia)}</h3>
                {items.filter((i) => i.event_day === dia).map((i, idx) => (
                  <div key={i.id} className="schedule-row">
                    <div className="schedule-num">Aula {idx + 1}</div>
                    <div className="schedule-info">
                      <div className="schedule-name">{i.name}</div>
                      <div className="schedule-time">{formatTimeRange(i.start_time, i.duration_minutes)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 34, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/programacao" className="btn-secondary">Ver programação completa</Link>
            <Link to="/professores" className="btn-secondary">Conhecer os professores</Link>
          </div>
        </div>
      </section>

      {/* 05 — CTA forte */}
      <section className="section off">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Sua vaga é gratuita.<br />Garanta agora.</h2>
          <p className="lead" style={{ margin: '14px auto 26px' }}>
            Vagas limitadas por dia. Escolha o sábado, o domingo ou os dois dias, em um único formulário.
          </p>
          <Link to="/inscricao" className="btn-primary">Quero me inscrever</Link>
        </div>
      </section>

      {/* 06 — Local */}
      <section className="section dark" id="local">
        <div className="container">
          <div className="section-kicker">04 — Local e informações</div>
          <h2>{settings.location_name}.</h2>

          <div className="local-section" style={{ marginTop: 30 }}>
            <div>
              <div className="local-info-list">
                <div className="row"><span className="label">Endereço</span><span>{settings.location_address}</span></div>
                <div className="row"><span className="label">Data</span><span>{formatDateRangeShort(settings.event_start_date, settings.event_end_date)}</span></div>
                <div className="row"><span className="label">Acesso</span><span>Evento aberto ao público, com estrutura para famílias e iniciantes.</span></div>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ marginTop: 24, display: 'inline-block' }}
              >
                Como chegar
              </a>
            </div>
            <div className="map-frame">
              <iframe
                src={`https://www.google.com/maps?q=${mapQuery}&hl=pt-BR&z=17&output=embed`}
                loading="lazy"
                title="Localização do evento"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
