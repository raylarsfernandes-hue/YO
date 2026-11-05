import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { DayPublic } from '../types'

export function useDays() {
  const [days, setDays] = useState<DayPublic[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    supabase
      .from('days_public')
      .select('*')
      .order('event_day', { ascending: true })
      .then(({ data }) => {
        setDays((data ?? []) as DayPublic[])
        setLoading(false)
      })
  }, [])

  useEffect(() => { reload() }, [reload])

  return { days, loading, reload }
}
