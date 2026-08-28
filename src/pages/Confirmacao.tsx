import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEventSettings } from '../hooks/useEventSettings'
import { useWorkshopSelection } from '../context/WorkshopSelectionContext'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { formatDayLong } from '../utils/format'

interface BatchRow {
  code: string
  full_name: string
  workshop_name: string
  teacher: string
  event_day: string
  start_time: string
  status: string
}

export default function Confirmacao() {
  const { batchId } = useParams()
  const { settings } = useEventSettings()
  const { clear } = useWorkshopSelection()
  const [rows, setRows] = useState<BatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    clear() // esvazia o carrinho de seleção — a inscrição já foi concluída
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!batchId) return
    supabase.rpc('get_registrations_by_batch', { p_batch_id: batchId }).then(({ data, error }) => {
      setLoading(false)
      if (error || !data || data.length === 0) {
        setNotFound(true)
        return
      }
      setRows(data as BatchRow[])
    })
  }, [batchId])

  const confirmed = rows.filter((r) => r.status === 'confirmed')
  const waitlisted = rows.filter((r) => r.status === 'waitlisted')

  return (
    <div>
      <Header />

      <div className="confirm-box">
        {loading && <p>Carregando...</p>}

        {!loading && notFound && (
          <>
            <h2>Inscrição não encontrada</h2>
            <p style={{ opacity: 0.7, marginTop: 10 }}>
              Não localizamos essa inscrição. Verifique o link ou faça uma nova inscrição.
            </p>
            <Link to="/oficinas" className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
              Ir para oficinas
            </Link>
          </>
        )}

        {!loading && rows.length > 0 && (
          <>
            <div className="confirm-stamp">✓</div>
            <h2>Inscrição confirmada!</h2>
            <p style={{ opacity: 0.75, marginTop: 10 }}>
              {rows[0].full_name} — guarde estes códigos, eles serão usados no check-in do evento.
            </p>

            {confirmed.length > 0 && (
              <div className="confirm-card">
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, marginBottom: 8 }}>
                  Vagas confirmadas ({confirmed.length})
                </div>
                {confirmed.map((r) => (
                  <div key={r.code} style={{ marginBottom: 14 }}>
                    <div className="row"><span>Oficina</span><strong>{r.workshop_name} — {r.teacher}</strong></div>
                    <div className="row"><span>Data</span><strong>{formatDayLong(r.event_day)} às {r.start_time}</strong></div>
                    <div className="row"><span>Local</span><strong>{settings.location_name}</strong></div>
                    <div className="confirm-code" style={{ fontSize: 18, padding: 10, marginTop: 8 }}><span>{r.code}</span></div>
                  </div>
                ))}
              </div>
            )}

            {waitlisted.length > 0 && (
              <div className="minor-notice" style={{ marginTop: 20, textAlign: 'left' }}>
                <strong>Lista de espera ({waitlisted.length})</strong>
                <p style={{ marginTop: 6 }}>
                  As oficinas abaixo já atingiram o limite de vagas. Você entrou na lista de espera e
                  será chamado(a) automaticamente se surgir uma vaga.
                </p>
                {waitlisted.map((r) => (
                  <div key={r.code} style={{ marginTop: 10, fontSize: 13 }}>
                    <strong>{r.workshop_name} — {r.teacher}</strong> · {formatDayLong(r.event_day)} às {r.start_time}
                    <br />
                    <span style={{ opacity: 0.7 }}>Código: {r.code}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 30, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/oficinas" className="btn-secondary">Ver outras oficinas</Link>
              <Link to="/" className="btn-primary">Voltar ao início</Link>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
