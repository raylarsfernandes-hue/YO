import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { Teacher } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProfessorModal from '../components/ProfessorModal'
import { resolveImageUrl } from '../utils/image'

export default function Professores() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Teacher | null>(null)

  useEffect(() => {
    supabase
      .from('teachers')
      .select('*')
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setTeachers((data ?? []) as Teacher[])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <Header />

      <section className="section dark">
        <div className="container">
          <div className="section-kicker">Quem participa</div>
          <h2>Professores.</h2>
          <p className="lead">
            Profissionais que vivem a cena todos os dias e foram convidados para o encontro.
          </p>

          {loading && <p style={{ marginTop: 20 }}>Carregando...</p>}
          {!loading && teachers.length === 0 && (
            <p style={{ marginTop: 20, opacity: 0.7 }}>Os professores serão divulgados em breve.</p>
          )}

          <div className="professores-grid">
            {teachers.map((t) => (
              <div key={t.id} className="professor-card">
                <div className="photo">
                  {t.photo_url ? <img src={resolveImageUrl(t.photo_url)!} alt={t.name} /> : <span className="placeholder">{t.name.charAt(0)}</span>}
                </div>
                <div className="body">
                  <h3>{t.name}</h3>
                  {t.modality && <div className="modality">{t.modality}</div>}
                  <p className="intro">
                    {t.bio
                      ? t.bio.slice(0, 90) + (t.bio.length > 90 ? '…' : '')
                      : 'Apresentação completa em breve.'}
                  </p>
                  <button type="button" className="btn-professor" style={{ width: '100%' }} onClick={() => setOpen(t)}>
                    Conheça
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 34, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/programacao" className="btn-secondary">Ver programação</Link>
            <Link to="/inscricao" className="btn-primary">Fazer inscrição</Link>
          </div>
        </div>
      </section>

      {open && <ProfessorModal teacher={open} onClose={() => setOpen(null)} />}

      <Footer />
    </div>
  )
}
