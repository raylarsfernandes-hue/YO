import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { WorkshopPublic } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SupportStrip from '../components/SupportStrip'
import { useEventSettings } from '../hooks/useEventSettings'
import { formatDayLong, formatDateRangeShort } from '../utils/format'
import { resolveImageUrl } from '../utils/image'
import heroDancer from '../assets/hero_dancer.webp'
import heroTitle from '../assets/hero_title.webp'
import sobreDancer from '../assets/sobre_dancer.webp'
import sobreTitle from '../assets/sobre_title.webp'

export default function Home() {
  const { settings } = useEventSettings()
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('workshops_public')
      .select('*')
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setWorkshops((data ?? []) as WorkshopPublic[])
        setLoading(false)
      })
  }, [])

  const totalVagas = workshops.reduce((acc, w) => acc + w.max_vagas, 0)
  const totalOcupadas = workshops.reduce((acc, w) => acc + w.taken, 0)
  const mapQuery = encodeURIComponent(`${settings.location_name}, ${settings.location_address}`)

  return (
    <div>
      <Header />

      {/* 01 — Abertura */}
      <section className="hero">
        <div className="container">
          <div className="hero-copy">
            <img src={heroTitle} alt="Sumaré Hip Hop Festival" className="hero-title-img" />
            <p className="sub">
              Dois dias de cultura Hip Hop gratuita em Sumaré: oficinas de dança, discotecagem,
              encontro e formação para quem já vive a cena e para quem está chegando agora.
            </p>
            <div className="hero-meta">
              <span className="pill amarelo">{formatDateRangeShort(settings.event_start_date, settings.event_end_date)}</span>
              <span className="pill">{settings.location_name}</span>
              <span className="pill vermelho">100% gratuito</span>
            </div>
            <div className="hero-actions">
              <Link to="/oficinas" className="btn-primary">Fazer inscrição</Link>
              <Link to="/oficinas" className="btn-secondary">Ver oficinas</Link>
            </div>
            <SupportStrip className="support-strip-mobile" />
          </div>
          <div className="hero-illustration">
            <img src={heroDancer} alt="Bailarino em movimento — identidade visual do Sumaré Hip Hop Festival" />
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
              O festival nasce como uma experiência gratuita de cultura Hip Hop, dança, formação
              e desenvolvimento social — aberta para quem já vive a cena e para quem está
              chegando agora.
            </p>
            <div className="stats-row">
              <div className="stat-box"><div className="num">2</div><div className="label">Dias de evento</div></div>
              <div className="stat-box"><div className="num">8</div><div className="label">Oficinas</div></div>
              <div className="stat-box"><div className="num">100%</div><div className="label">Gratuito</div></div>
              <div className="stat-box highlight">
                <div className="num">{loading ? '—' : Math.max(totalVagas - totalOcupadas, 0)}</div>
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
            Rua, movimento, cultura, encontro, formação e território. O Sumaré Hip Hop Festival
            existe para fortalecer a cena local e abrir acesso à cultura — com força para crescer
            além de uma única edição.
          </p>
          <Link to="/sobre" className="link-more">Conheça o projeto completo →</Link>
        </div>
      </section>

      {/* 04 — Escolha sua oficina */}
      <section className="section dark" id="oficinas">
        <div className="container">
          <div className="section-kicker">03 — Programação</div>
          <h2>Escolha sua oficina.</h2>
          <p className="lead">Professor, modalidade e horário — reconheça de cara quem vai te ensinar.</p>

          {loading && <p style={{ marginTop: 20 }}>Carregando oficinas...</p>}

          <div className="preview-grid">
            {workshops.slice(0, 8).map((w) => (
              <Link key={w.id} to={`/oficinas?select=${w.id}`} className="preview-card">
                <div className="preview-photo">
                  {w.teacher_photo_url ? (
                    <img src={resolveImageUrl(w.teacher_photo_url)!} alt={w.teacher} />
                  ) : (
                    <span className="placeholder">{w.teacher.charAt(0)}</span>
                  )}
                </div>
                <div className="preview-body">
                  <div className="preview-name">{w.teacher}</div>
                  <div className="preview-modality">{w.name}</div>
                  <div className="preview-meta">{formatDayLong(w.event_day)} · {w.start_time.slice(0, 5)}</div>
                  <span className="preview-cta">Ver oficina</span>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 34 }}>
            <Link to="/oficinas" className="btn-primary">Ver todas as oficinas</Link>
          </div>
        </div>
      </section>

      {/* 05 — CTA forte */}
      <section className="section off">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Sua vaga é gratuita.<br />Garanta agora.</h2>
          <p className="lead" style={{ margin: '14px auto 26px' }}>
            Vagas limitadas por oficina — inscreva-se em quantas quiser, de um único formulário.
          </p>
          <Link to="/oficinas" className="btn-primary">Quero me inscrever</Link>
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
                Abrir no Google Maps
              </a>
            </div>
            <div className="map-frame">
              <iframe
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
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
