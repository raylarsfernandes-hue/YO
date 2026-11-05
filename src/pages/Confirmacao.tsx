import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useEventSettings } from '../hooks/useEventSettings'
import type { ConfirmationRow } from '../types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { formatDayLong, formatParticipationLong } from '../utils/format'

export default function Confirmacao() {
  const { batchId } = useParams()
  const { settings } = useEventSettings()
  const [rows, setRows] = useState<ConfirmationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!batchId) return
    supabase.rpc('get_registrations_by_batch', { p_batch_id: batchId }).then(({ data, error }) => {
      setLoading(false)
      if (error || !data || data.length === 0) {
        setNotFound(true)
        return
      }
      setRows(data as ConfirmationRow[])
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
            <Link to="/inscricao" className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
              Ir para a inscrição
            </Link>
          </>
        )}

        {!loading && rows.length > 0 && (
          <>
            <div className="confirm-stamp">✓</div>
            <h2>Inscrição confirmada!</h2>
            <p style={{ opacity: 0.75, marginTop: 10 }}>
              {rows[0].full_name}, você está inscrito(a) no <strong>Encontro de Danças Urbanas de Sumaré</strong>.
              Guarde o código do seu dia, ele será usado no check-in.
            </p>

            {confirmed.length > 0 && (
              <div className="confirm-card">
                <div className="row">
                  <span>Participação</span>
                  <strong>{formatParticipationLong(confirmed.map((r) => r.event_day))}</strong>
                </div>
                <div className="row">
                  <span>Local</span>
                  <strong style={{ textAlign: 'right' }}>{settings.location_name}</strong>
                </div>
                <div className="row">
                  <span>Endereço</span>
                  <strong style={{ textAlign: 'right', maxWidth: '65%' }}>{settings.location_address}</strong>
                </div>

                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, margin: '16px 0 4px' }}>
                  {confirmed.length > 1 ? 'Códigos de check-in' : 'Código de check-in'}
                </div>
                {confirmed.map((r) => (
                  <div key={r.code} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>{formatDayLong(r.event_day)}</div>
                    <div className="confirm-code" style={{ fontSize: 18, padding: 10, marginTop: 4 }}><span>{r.code}</span></div>
                  </div>
                ))}
              </div>
            )}

            {waitlisted.length > 0 && (
              <div className="minor-notice" style={{ marginTop: 20, textAlign: 'left' }}>
                <strong>Lista de espera</strong>
                {waitlisted.map((r) => (
                  <div key={r.code} style={{ marginTop: 10, fontSize: 13 }}>
                    {formatDayLong(r.event_day)}
                    <br />
                    <span style={{ opacity: 0.7 }}>Código: {r.code}</span>
                  </div>
                ))}
              </div>
            )}

            <p style={{ marginTop: 22, fontSize: 14, opacity: 0.8 }}>
              A inscrição dá acesso às aulas programadas para o(s) dia(s) selecionado(s).
            </p>

            <div style={{ marginTop: 26, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to={{ pathname: '/', hash: '#programacao' }} className="btn-secondary">Ver programação</Link>
              <Link to="/" className="btn-primary">Voltar ao início</Link>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
