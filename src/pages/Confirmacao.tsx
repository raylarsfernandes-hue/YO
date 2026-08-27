import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import type { ConfirmationData } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useEventSettings } from '../hooks/useEventSettings'
import { formatDayLong } from '../utils/format'

export default function Confirmacao() {
  const { code } = useParams()
  const { settings } = useEventSettings()
  const [data, setData] = useState<ConfirmationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!code) return
    supabase.rpc('get_registration_by_code', { p_code: code }).then(({ data: rows, error }) => {
      setLoading(false)
      const row = Array.isArray(rows) ? rows[0] : rows
      if (error || !row) {
        setNotFound(true)
        return
      }
      setData(row as ConfirmationData)
    })
  }, [code])

  return (
    <div>
      <Header />

      <div className="confirm-box">
        {loading && <p>Carregando...</p>}

        {!loading && notFound && (
          <>
            <h2>Inscrição não encontrada</h2>
            <p style={{ opacity: 0.7, marginTop: 10 }}>
              Não localizamos essa inscrição. Verifique o código ou faça uma nova inscrição.
            </p>
            <Link to="/inscricao" className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
              Ir para inscrições
            </Link>
          </>
        )}

        {!loading && data && (
          <>
            <div className="confirm-check">✓</div>
            <h2>Inscrição confirmada!</h2>
            <p style={{ opacity: 0.75, marginTop: 10 }}>
              {data.status === 'cancelled'
                ? 'Atenção: esta inscrição foi cancelada.'
                : 'Guarde este comprovante — ele será usado no check-in do evento.'}
            </p>

            <div className="confirm-card">
              <div className="row"><span>Nome</span><strong>{data.full_name}</strong></div>
              <div className="row"><span>Oficina</span><strong>{data.workshop_name}</strong></div>
              <div className="row"><span>Professor(a)</span><strong>{data.teacher}</strong></div>
              <div className="row"><span>Data</span><strong>{formatDayLong(data.event_day)}</strong></div>
              <div className="row"><span>Horário</span><strong>{data.start_time}</strong></div>
              <div className="row"><span>Local</span><strong>{settings.location_name}</strong></div>
            </div>

            <div className="confirm-code">{data.code}</div>

            <div style={{ marginTop: 30, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/inscricao" className="btn-secondary">Inscrever-se em outra oficina</Link>
              <Link to="/" className="btn-primary">Voltar ao início</Link>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
