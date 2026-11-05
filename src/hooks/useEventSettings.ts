import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { EventSettings } from '../types'

const FALLBACK: EventSettings = {
  location_name: 'Colégio Alfredo Castro Donaire',
  location_address: 'Rua São Timóteo, 121 - Jardim Santa Olívia - Nova Veneza / Região do Matão - Sumaré/SP - CEP 13180-461',
  map_query: 'Colégio Alfredo Castro Donaire, Rua São Timóteo, 121, Jardim Santa Olívia, Sumaré - SP, 13180-461',
  max_vagas_dia1: 100,
  max_vagas_dia2: 100,
  event_start_date: '2026-11-21',
  event_end_date: '2026-11-22',
  guardian_authorization_pdf_url: null,
}

export function useEventSettings() {
  const [settings, setSettings] = useState<EventSettings>(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('event_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as EventSettings)
        setLoading(false)
      })
  }, [])

  return { settings, loading }
}
