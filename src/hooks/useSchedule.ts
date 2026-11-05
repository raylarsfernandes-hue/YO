import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { ScheduleItem } from '../types'

export function useSchedule() {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('schedule_public')
      .select('*')
      .order('event_day', { ascending: true })
      .order('start_time', { ascending: true })
      .then(({ data }) => {
        setItems((data ?? []) as ScheduleItem[])
        setLoading(false)
      })
  }, [])

  const dias = Array.from(new Set(items.map((i) => i.event_day))).sort()
  return { items, dias, loading }
}
