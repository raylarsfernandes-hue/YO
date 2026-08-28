import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { WorkshopPublic } from '../types'

interface SelectionContextValue {
  selected: WorkshopPublic[]
  toggle: (workshop: WorkshopPublic) => void
  remove: (workshopId: string) => void
  clear: () => void
  isSelected: (workshopId: string) => boolean
}

const SelectionContext = createContext<SelectionContextValue | null>(null)

export function WorkshopSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<WorkshopPublic[]>([])

  const toggle = useCallback((workshop: WorkshopPublic) => {
    setSelected((prev) =>
      prev.some((w) => w.id === workshop.id)
        ? prev.filter((w) => w.id !== workshop.id)
        : [...prev, workshop]
    )
  }, [])

  const remove = useCallback((workshopId: string) => {
    setSelected((prev) => prev.filter((w) => w.id !== workshopId))
  }, [])

  const clear = useCallback(() => setSelected([]), [])

  const isSelected = useCallback(
    (workshopId: string) => selected.some((w) => w.id === workshopId),
    [selected]
  )

  return (
    <SelectionContext.Provider value={{ selected, toggle, remove, clear, isSelected }}>
      {children}
    </SelectionContext.Provider>
  )
}

export function useWorkshopSelection() {
  const ctx = useContext(SelectionContext)
  if (!ctx) throw new Error('useWorkshopSelection precisa estar dentro de WorkshopSelectionProvider')
  return ctx
}
