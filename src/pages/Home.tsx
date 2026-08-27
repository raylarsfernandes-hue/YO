import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { WorkshopPublic } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import InstitutionalBar from '../components/InstitutionalBar'
import { useEventSettings } from '../hooks/useEventSettings'
import { formatDayLong, formatDateRangeShort } from '../utils/format'

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
  const dias = Array.from(new Set(workshops.map((w) => w.event_day))).sort()

  return (
    <div>
      <Header />

      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">Direção criativa / brand board aprovado</div>
          <h1>Sumaré<br />Hip Hop<br />Festival</h1>
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
            <Link to="/inscricao" className="btn-primary">Fazer inscrição</Link>
            <Link to="/oficinas" className="btn-secondary">Ver oficinas</Link>
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
                    borderRadius: 4, padding: '14px 18px', minWidth: 220,
                  }}>
                    <strong>{w.name}</strong> — {w.teacher}
                    <div style={{ fontSize: 13, opacity: 0.6 }}>{w.start_time} · {w.vagas_restantes} vagas</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 40 }}>
            <Link to="/inscricao" className="btn-primary">Quero me inscrever</Link>
          </div>
        </div>
      </section>

      <section className="section dark" id="local">
        <div className="container">
          <div className="section-kicker">03 — Local e informações</div>
          <h2>{settings.location_name}.</h2>
          <p className="lead">
            Evento realizado em {settings.location_name} ({settings.location_address}), com apoio da
            Prefeitura de Sumaré. Estrutura pensada para famílias, iniciantes e artistas da cena.
          </p>
        </div>
      </section>

      <InstitutionalBar />

      <Footer />
    </div>
  )
}
