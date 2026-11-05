import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export interface TeacherPublic {
  id: string
  name: string
  photo_url: string | null
  order_index: number
}

// A view teachers_public só expõe id, nome, foto e ordem (sem modalidade, aula ou horário).
export function useTeachers() {
  const [teachers, setTeachers] = useState<TeacherPublic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('teachers_public')
      .select('*')
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        setTeachers((data ?? []) as TeacherPublic[])
        setLoading(false)
      })
  }, [])

  return { teachers, loading }
}
