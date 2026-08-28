import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { WorkshopPublic } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ProfessorModal from '../components/ProfessorModal'
import { resolveImageUrl } from '../utils/image'

interface ProfessorEntry {
  teacher: string
  photo: string | null
  bio: string | null
  modalities: string[]
  representative: WorkshopPublic
}

export default function Professores() {
  const [workshops, setWorkshops] = useState<WorkshopPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [openProfessor, setOpenProfessor] = useState<WorkshopPublic | null>(null)

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

  const professores: ProfessorEntry[] = []
  workshops.forEach((w) => {
    const existing = professores.find((p) => p.teacher === w.teacher)
    if (existing) {
      existing.modalities.push(w.name)
    } else {
      professores.push({
        teacher: w.teacher,
        photo: w.teacher_photo_url,
        bio: w.teacher_bio,
        modalities: [w.name],
        representative: w,
      })
    }
  })

  return (
    <div>
      <Header />

      <section className="section dark">
        <div className="container">
          <div className="section-kicker">Quem ensina</div>
          <h2>Professores.</h2>
          <p className="lead">
            Profissionais que vivem a cena todos os dias — conheça quem vai ministrar cada
            oficina do festival.
          </p>

          {loading && <p style={{ marginTop: 20 }}>Carregando...</p>}

          <div className="professores-grid">
            {professores.map((p) => (
              <div key={p.teacher} className="professor-card">
                <div className="photo">
                  {p.photo ? <img src={resolveImageUrl(p.photo)!} alt={p.teacher} /> : <span className="placeholder">{p.teacher.charAt(0)}</span>}
                </div>
                <div className="body">
                  <h3>{p.teacher}</h3>
                  <div className="modality">{p.modalities.join(' · ')}</div>
                  <p className="intro">
                    {p.bio
                      ? p.bio.slice(0, 90) + (p.bio.length > 90 ? '…' : '')
                      : 'Release completo em breve.'}
                  </p>
                  <button type="button" className="btn-professor" style={{ width: '100%' }} onClick={() => setOpenProfessor(p.representative)}>
                    Conheça
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 34 }}>
            <Link to="/oficinas" className="btn-primary">Ver oficinas</Link>
          </div>
        </div>
      </section>

      {openProfessor && <ProfessorModal workshop={openProfessor} onClose={() => setOpenProfessor(null)} />}

      <Footer />
    </div>
  )
}
