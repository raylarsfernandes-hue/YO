import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { WorkshopPublic } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { formatDayLong } from '../utils/format'

import logo from '../assets/logo_cutout.webp'
import dancer from '../assets/dancer_cutout.webp'
import skyline from '../assets/skyline.png'
import halftone from '../assets/halftone_yellow.png'
import crown from '../assets/crown_yellow.png'
import chevrons from '../assets/chevrons.png'
import brushBlack from '../assets/brush_black.png'

export default function Home() {
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
  const dias = Array.from(new Set(workshops.map((w) => w.event_day))).sort()

  return (
    <div>
      <Header />

      <section className="hero">
        <img src={skyline} alt="" className="hero-skyline" aria-hidden="true" />
        <img src={halftone} alt="" className="hero-halftone" aria-hidden="true" />

        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow"><span>24 + 25 de outubro · CÉU das Artes de Sumaré</span></div>
            <img src={logo} alt="Sumaré Hip Hop Festival" className="hero-logo" />
            <p className="sub">
              Dois dias de cultura Hip Hop gratuita em Sumaré: oficinas de dança, discotecagem,
              encontro e formação para quem já vive a cena e para quem está chegando agora.
            </p>
            <div className="hero-meta">
              <span className="pill amarelo">Workshops gratuitos</span>
              <span className="pill vermelho">Vagas limitadas</span>
            </div>
            <div className="hero-actions">
              <Link to="/inscricao" className="btn-primary"><span>Ver aulas e me inscrever</span></Link>
              <a href="#oficinas" className="btn-secondary">Ver programação</a>
            </div>
          </div>

          <div className="hero-visual">
            <img src={crown} alt="" className="hero-crown" aria-hidden="true" />
            <img src={dancer} alt="Bailarino em movimento" className="hero-dancer" />
          </div>
        </div>
      </section>

      <section className="section dark" id="sobre">
        <div className="container">
          <div className="section-kicker">01 — Sobre o projeto</div>
          <h2>Uma marca cultural própria.</h2>
          <p className="lead">
            O festival nasce como uma experiência gratuita de cultura Hip Hop, dança, formação
            e desenvolvimento social. Rua, movimento, cultura, encontro, formação e território —
            tudo em dois dias abertos para a comunidade de Sumaré e região.
          </p>
          <div className="stats-row">
            <div className="stat-box"><div className="num">2</div><div className="label">Dias de evento</div></div>
            <div className="stat-box"><div className="num">8</div><div className="label">Oficinas</div></div>
            <div className="stat-box"><div className="num">100%</div><div className="label">Gratuito</div></div>
            <div className="stat-box">
              <div className="num">{loading ? '—' : Math.max(totalVagas - totalOcupadas, 0)}</div>
              <div className="label">Vagas disponíveis agora</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section off" id="oficinas">
        <div className="container">
          <div className="section-kicker">02 — Oficinas</div>
          <h2>Escolha sua vertente.</h2>
          <p className="lead">
            Cada oficina tem cerca de 1h10 de duração e vagas limitadas. Confira os dias e
            professores — e garanta seu lugar antes que a turma esgote.
          </p>

          {dias.map((dia) => (
            <div key={dia} style={{ marginTop: 34 }}>
              <h3 style={{ fontSize: 20, color: 'var(--vermelho)', marginBottom: 4 }}>
                {formatDayLong(dia)}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
                {workshops.filter((w) => w.event_day === dia).map((w) => (
                  <div key={w.id} style={{
                    background: 'var(--branco)', border: '1px solid #d8d4c8',
                    padding: '14px 18px', minWidth: 220,
                  }}>
                    <strong>{w.name}</strong> — {w.teacher}
                    <div style={{ fontSize: 13, opacity: 0.6 }}>{w.start_time} · {w.vagas_restantes} vagas</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 40 }}>
            <Link to="/inscricao" className="btn-primary"><span>Quero me inscrever</span></Link>
          </div>
        </div>
      </section>

      <section className="section dark" id="local">
        <img src={chevrons} alt="" style={{ position: 'absolute', top: 30, left: 20, width: 140, opacity: 0.6 }} aria-hidden="true" />
        <div className="container">
          <div className="section-kicker">03 — Local e informações</div>
          <h2>CÉU das Artes de Sumaré.</h2>
          <p className="lead">
            Evento realizado ao ar livre e em espaços cobertos do CÉU das Artes, com apoio da
            Prefeitura de Sumaré. Estrutura pensada para famílias, iniciantes e artistas da cena.
          </p>
          <img src={brushBlack} alt="" style={{ width: 220, opacity: 0.5, marginTop: 30 }} aria-hidden="true" />
        </div>
      </section>

      <Footer />
    </div>
  )
}
