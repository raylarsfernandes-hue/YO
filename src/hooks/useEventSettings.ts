import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { EventSettings } from '../types'

const FALLBACK: EventSettings = {
  location_name: 'CÉU das Artes de Sumaré',
  location_address: 'Sumaré/SP',
  event_start_date: '2026-10-24',
  event_end_date: '2026-10-25',
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
